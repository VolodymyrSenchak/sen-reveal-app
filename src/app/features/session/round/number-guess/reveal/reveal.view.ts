import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, NumberGuessRoundView } from '../../../../../models';
import { NumberGuess } from '../../../../../session/actions';
import { seededSignal } from '../../../../../session/seeded-signal';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AvatarComponent } from '../../../../../ui/avatar';
import { SessionTopComponent } from '../../../../../ui/session-top';
import { formatNumber, parseGuess } from '../number-input';

/**
 * `number-guess`, `phase: 'revealed'`. Everyone sees the same numbers; only the active player
 * (`canSetCorrectAnswer`) gets the box for the right one — and typing it is what scores the round.
 * Nobody votes.
 */
@Component({
  selector: 'app-ng-reveal-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent],
  templateUrl: './reveal.view.html',
  styleUrl: './reveal.view.scss',
})
export class NumberGuessRevealView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  /** The shell only renders this view for `number-guess`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.roundAs<NumberGuessRoundView>());

  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly nameOf = computed(() => this.store.nicknameOf());
  protected readonly format = formatNumber;

  /** Low to high: the numbers read as a line, which is what everyone is arguing about anyway. */
  protected readonly guesses = computed(() => [...(this.round()?.guesses ?? [])].sort((a, b) => a.value - b.value));

  /** Cleared when the round moves on, so a new reveal never starts with last round's answer. */
  protected readonly draft = seededSignal(
    () => this.round()?.number ?? 0,
    () => '',
  );

  private readonly parsed = computed(() => parseGuess(this.draft()));

  protected readonly error = computed(() => (this.draft().trim() ? this.parsed().error : null));
  protected readonly canConfirm = computed(() => this.parsed().value !== null);

  protected confirm(): void {
    const value = this.parsed().value;
    if (value === null) {
      return;
    }
    this.act.emit(NumberGuess.setCorrectAnswer(value));
  }
}
