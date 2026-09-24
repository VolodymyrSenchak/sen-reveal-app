import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { errorMessage } from '../../core/api-error';
import { IdentityService } from '../../core/identity.service';
import { GameAction, TerminalReason } from '../../models';
import { Lobby } from '../../session/actions';
import { SessionStore } from '../../session/session.store';
import { TransportManager } from '../../session/transport.manager';
import { EndedView } from './ended.view';
import { LobbyView } from './lobby/lobby.view';
import { NumberGuessAskView } from './round/number-guess/ask.view';
import { NumberGuessGuessView } from './round/number-guess/guess.view';
import { NumberGuessResultView } from './round/number-guess/result.view';
import { NumberGuessRevealView } from './round/number-guess/reveal.view';
import { PausedView } from './paused.view';
import { AnswerView } from './round/sen-reveal/answer.view';
import { AskView } from './round/sen-reveal/ask.view';
import { ResultView } from './round/sen-reveal/result.view';
import { RevealView } from './round/sen-reveal/reveal.view';
import { WhoAmIBoardView } from './round/who-am-i/board.view';
import { WhoAmINameView } from './round/who-am-i/name.view';
import { pickScreen } from './screen';


/** How long a conflict / rate-limit note stays up before the next snapshot takes over. */
const TOAST_MS = 3500;

/**
 * The session shell. It provides the store and the transport, subscribes once, and picks a child
 * by phase. One route, not one route per phase: state arrives by push, and a route per phase
 * would turn every snapshot into a navigation.
 */
@Component({
  selector: 'app-session',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SessionStore, TransportManager],
  imports: [
    LobbyView,
    AskView,
    AnswerView,
    RevealView,
    ResultView,
    NumberGuessAskView,
    NumberGuessGuessView,
    NumberGuessRevealView,
    NumberGuessResultView,
    WhoAmINameView,
    WhoAmIBoardView,
    EndedView,
    PausedView,
  ],
  template: `
    @switch (screen()) {
      @case ('loading') {
        <div class="screen session__loading">
          <p class="hint">Finding the room…</p>
        </div>
      }
      @case ('lobby') {
        <app-lobby-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
      }
      @case ('ask') {
        @if (isNumberGuess()) {
          <app-ng-ask-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
        } @else {
          <app-ask-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
        }
      }
      @case ('answer') {
        @if (isNumberGuess()) {
          <app-ng-guess-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
        } @else {
          <app-answer-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
        }
      }
      @case ('reveal') {
        @if (isNumberGuess()) {
          <app-ng-reveal-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
        } @else {
          <app-reveal-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
        }
      }
      @case ('result') {
        @if (isNumberGuess()) {
          <app-ng-result-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
        } @else {
          <app-result-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
        }
      }
      @case ('name') {
        <app-wai-name-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
      }
      @case ('board') {
        <app-wai-board-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
      }
      @case ('paused') {
        <app-paused-view [banner]="banner()" [toast]="toast()" (act)="dispatch($event)" (exit)="leave()" />
      }
      @case ('ended') {
        <app-ended-view [reason]="endedReason()" [code]="code()" />
      }
    }
  `,
  styles: `
    .session__loading {
      align-items: center;
      justify-content: center;
    }
  `,
})
export class SessionPage implements OnInit {
  private readonly identity = inject(IdentityService);
  private readonly transport = inject(TransportManager);
  private readonly router = inject(Router);

  protected readonly store = inject(SessionStore);

  /** `/s/:code`, bound from the route. */
  readonly code = input.required<string>();

  protected readonly toast = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly banner = computed(() => this.transport.connection());

  protected readonly endedReason = computed<TerminalReason>(() => {
    const terminal = this.transport.terminal();
    if (terminal) {
      return terminal;
    }
    return 'finished';
  });

  protected readonly screen = computed(() =>
    pickScreen(this.store.view(), this.transport.terminal(), this.store.isAsker()),
  );

  /**
   * The one place the shell cares which game it is: the four round screens come in a set per game.
   * (who-am-i has its own two, 'name' and 'board', which `pickScreen` already routes by game type.)
   * Everything around them (lobby, paused, ended, the store, the transport) is game-agnostic.
   */
  protected readonly isNumberGuess = computed(() => this.store.view()?.gameType === 'number-guess');

  ngOnInit(): void {
    const code = this.code();
    const identity = this.identity.get(code);
    if (!identity) {
      // `/s/:code` is also what a shared link lands on for someone who has never been here
      void this.router.navigate(['/join'], { queryParams: { code } });
      return;
    }
    this.transport.start(code, identity.playerToken);
  }

  protected async dispatch(action: GameAction): Promise<void> {
    const result = await this.transport.dispatch(action);
    if (result.ok) {
      return;
    }
    // A failed action leaves the store untouched: the next snapshot is the truth. Say little.
    this.showToast(errorMessage(result.error));
  }

  protected async leave(): Promise<void> {
    // Tell the room first, so the others see the seat empty instead of a ghost going offline.
    await this.transport.dispatch(Lobby.leave());
    this.identity.clear(this.code());
    this.transport.stop();
    void this.router.navigate(['/']);
  }

  private showToast(message: string): void {
    this.toast.set(message);
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => this.toast.set(null), TOAST_MS);
  }
}
