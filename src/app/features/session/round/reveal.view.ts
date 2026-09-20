import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { GameAction } from '../../../models';
import { SenReveal } from '../../../session/actions';
import { SessionStore } from '../../../session/session.store';
import { ConnectionState } from '../../../session/session.transport';
import { AvatarComponent } from '../../../ui/avatar';
import { SessionTopComponent } from '../../../ui/session-top';

/**
 * Revealed.dc.html — `phase: 'revealed'`. Everyone sees the same cards; only the asker
 * (`canPickResult`) gets the Best / Worst buttons and the confirm.
 */
@Component({
  selector: 'app-reveal-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent],
  template: `
    @if (store.round(); as round) {
      <div class="screen">
        <app-session-top
          [code]="store.code() ?? ''"
          [subtitle]="'Round ' + round.number + ' · revealed'"
          [banner]="banner()"
          [pollIntervalMs]="store.pollIntervalMs()"
          [toast]="toast()"
          (exit)="exit.emit()"
        />

        <div class="reveal__question">
          <app-avatar [nickname]="asker()" [isHost]="true" [size]="28" />
          <p class="reveal__questionText">
            {{ round.question ?? asker() + ' asked out loud.' }}
          </p>
        </div>

        <div>
          @if (round.canPickResult) {
            <h1 class="reveal__title">Pick the best and the worst</h1>
            <p class="reveal__lede">
              Your call, {{ store.me()?.nickname }}. Everyone is looking at the same {{ answers().length }} cards.
            </p>
          } @else {
            <h1 class="reveal__title">The answers</h1>
            <p class="reveal__lede">{{ asker() }} is picking the best and the worst.</p>
          }
        </div>

        <ul class="reveal__cards" aria-live="polite">
          @for (answer of answers(); track answer.playerId; let i = $index) {
            <li
              class="answerCard"
              [class.answerCard--best]="winnerId() === answer.playerId"
              [class.answerCard--worst]="loserId() === answer.playerId"
              [style.--delay.ms]="i * 180"
            >
              <div class="answerCard__head">
                <app-avatar [nickname]="nameOf()(answer.playerId)" [size]="30" />
                <span class="answerCard__name">{{ nameOf()(answer.playerId) }}</span>
                @if (round.canPickResult) {
                  <button
                    type="button"
                    class="pick pick--best"
                    [class.pick--on]="winnerId() === answer.playerId"
                    [attr.aria-pressed]="winnerId() === answer.playerId"
                    (click)="pickBest(answer.playerId)"
                  >
                    Best
                  </button>
                  <button
                    type="button"
                    class="pick pick--worst"
                    [class.pick--on]="loserId() === answer.playerId"
                    [attr.aria-pressed]="loserId() === answer.playerId"
                    (click)="pickWorst(answer.playerId)"
                  >
                    Worst
                  </button>
                }
              </div>
              <p class="answerCard__text">{{ answer.value }}</p>
            </li>
          }
        </ul>

        <div class="spacer"></div>

        @if (round.canPickResult) {
          <button class="btn btn--primary" type="button" [disabled]="!canConfirm()" (click)="confirm()">
            Confirm the picks
          </button>
          <p class="footnote">{{ confirmHint() }}</p>
        } @else {
          <p class="footnote">{{ asker() }} is picking. Nothing for you to do but have opinions out loud.</p>
        }
      </div>
    }
  `,
  styles: `
    .reveal__question {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 13px 15px;
      border-radius: var(--r-field);
      background: var(--card);
      border: 1.5px solid var(--line);
    }

    .reveal__questionText {
      font-size: 15px;
      line-height: 1.35;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .reveal__title {
      font-size: 26px;
      letter-spacing: -0.6px;
    }

    .reveal__lede {
      margin-top: 3px;
      font-size: 13.5px;
      color: var(--muted);
    }

    .reveal__cards {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    /* Reveals land, they don't slide: one card after another, 180 ms each. */
    .answerCard {
      border: 1.5px solid var(--line);
      border-radius: var(--r-card);
      background: var(--card);
      padding: 14px 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      animation: land var(--t-reveal) ease-out backwards;
      animation-delay: var(--delay, 0ms);
    }

    @keyframes land {
      from {
        opacity: 0;
        transform: translateY(6px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    .answerCard--best {
      border: 2px solid var(--go);
    }

    .answerCard--worst {
      border: 2px solid var(--worst);
    }

    .answerCard__head {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .answerCard__name {
      flex-grow: 1;
      min-width: 0;
      font-size: 15px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .answerCard__text {
      font-size: 16.5px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .pick {
      height: var(--tap);
      padding: 0 14px;
      border-radius: 12px;
      border: 1.5px solid var(--line-strong);
      background: transparent;
      color: var(--muted);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--t-quick) ease, color var(--t-quick) ease;
    }

    .pick--best.pick--on {
      border-color: transparent;
      background: var(--go);
      color: var(--room);
      font-weight: 700;
    }

    .pick--worst.pick--on {
      border-color: transparent;
      background: var(--worst);
      color: var(--room);
      font-weight: 700;
    }
  `,
})
export class RevealView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly nameOf = computed(() => this.store.nicknameOf());
  protected readonly answers = computed(() => this.store.round()?.answers ?? []);

  /** Cleared when the round moves on, so a new reveal never starts with last round's picks. */
  protected readonly winnerId = linkedSignal<number, string | null>({
    source: () => this.store.round()?.number ?? 0,
    computation: () => null,
  });
  protected readonly loserId = linkedSignal<number, string | null>({
    source: () => this.store.round()?.number ?? 0,
    computation: () => null,
  });

  /** With a single answer the loser may be null; otherwise both are required and distinct. */
  protected readonly canConfirm = computed(() => {
    const winner = this.winnerId();
    if (!winner) {
      return false;
    }
    return this.answers().length === 1 ? true : this.loserId() !== null && this.loserId() !== winner;
  });

  protected readonly confirmHint = computed(() => {
    if (this.canConfirm()) {
      return 'Final — no take-backs. Everyone else just reads the cards and waits for you.';
    }
    if (!this.winnerId()) {
      return 'Pick the best one first.';
    }
    return this.answers().length === 1 ? '' : 'Now pick the worst — it has to be someone else.';
  });

  protected pickBest(playerId: string): void {
    this.winnerId.set(this.winnerId() === playerId ? null : playerId);
    if (this.loserId() === playerId) {
      this.loserId.set(null);
    }
  }

  protected pickWorst(playerId: string): void {
    this.loserId.set(this.loserId() === playerId ? null : playerId);
    if (this.winnerId() === playerId) {
      this.winnerId.set(null);
    }
  }

  protected confirm(): void {
    const winner = this.winnerId();
    if (!winner || !this.canConfirm()) {
      return;
    }
    this.act.emit(SenReveal.pickResult(winner, this.answers().length === 1 ? null : this.loserId()));
  }
}
