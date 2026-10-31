import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, NumberGuessRoundView } from '../../../../../models';
import { NumberGuess } from '../../../../../session/actions';
import { seededSignal } from '../../../../../session/seeded-signal';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AnswersProgressComponent } from '../../../../../ui/answers-progress';
import { AvatarComponent } from '../../../../../ui/avatar';
import { IconComponent } from '../../../../../ui/icon';
import { SessionTopComponent } from '../../../../../ui/session-top';
import { formatNumber, parseGuess } from '../number-input';

/** `number-guess`, `phase: 'answering'`, the viewer is in `eligiblePlayerIds`. */
@Component({
  selector: 'app-ng-guess-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AnswersProgressComponent, AvatarComponent, IconComponent],
  templateUrl: './guess.view.html',
  styleUrl: './guess.view.scss',
})
export class NumberGuessGuessView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  /** The shell only renders this view for `number-guess`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.roundAs<NumberGuessRoundView>());

  protected readonly circle = computed(() => this.store.game()?.circle.number ?? 1);
  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly formatNumber = formatNumber;

  /** Seeded from `myGuess` once per round, then the field is the player's own. */
  protected readonly draft = seededSignal(
    () => this.round()?.number ?? 0,
    () => {
      const mine = this.round()?.myGuess;
      return mine === null || mine === undefined ? '' : String(mine);
    },
  );

  private readonly parsed = computed(() => parseGuess(this.draft()));

  /** Silent while the field is still empty — an error for "nothing typed yet" is just nagging. */
  protected readonly error = computed(() => (this.draft().trim() ? this.parsed().error : null));

  protected readonly canSend = computed(() => {
    const value = this.parsed().value;
    return value !== null && value !== this.round()?.myGuess;
  });

  protected submit(): void {
    const value = this.parsed().value;
    if (value === null || !this.canSend()) {
      return;
    }
    this.act.emit(NumberGuess.submitGuess(value));
  }
}
