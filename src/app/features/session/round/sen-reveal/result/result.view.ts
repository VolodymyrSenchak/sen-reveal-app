import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { GameAction, SenRevealRoundView } from '../../../../../models';
import { SenReveal } from '../../../../../session/actions';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AvatarComponent } from '../../../../../ui/avatar';
import { IconComponent } from '../../../../../ui/icon';
import { SessionTopComponent } from '../../../../../ui/session-top';

/** Result.dc.html — `phase: 'resolved'`. Only the asker has `canGoNext`. */
@Component({
  selector: 'app-result-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent, IconComponent],
  templateUrl: './result.view.html',
  styleUrl: './result.view.scss',
})
export class ResultView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  /** The shell only renders this view for `sen-reveal`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.roundAs<SenRevealRoundView>());

  protected readonly nextRound = SenReveal.nextRound;
  protected readonly skipRound = SenReveal.skipRound;

  protected readonly showAll = signal(false);

  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly nameOf = computed(() => this.store.nicknameOf());
  protected readonly circle = computed(() => this.store.game()?.circle.number ?? 1);
  protected readonly answers = computed(() => this.round()?.answers ?? []);
  protected readonly board = computed(() => this.store.scoreboard());
  protected readonly askedCount = computed(() => this.board().filter((score) => score.turns > 0).length);

  protected readonly winner = computed(() => this.findAnswer(this.round()?.winnerId));
  protected readonly loser = computed(() => this.findAnswer(this.round()?.loserId));

  protected initial(nickname: string): string {
    return nickname.trim().charAt(0).toUpperCase() || '?';
  }

  private findAnswer(playerId: string | null | undefined) {
    return playerId ? (this.answers().find((answer) => answer.playerId === playerId) ?? null) : null;
  }
}
