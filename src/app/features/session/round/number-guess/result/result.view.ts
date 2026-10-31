import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, NumberGuessRoundView } from '../../../../../models';
import { NumberGuess } from '../../../../../session/actions';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AvatarComponent } from '../../../../../ui/avatar';
import { IconComponent } from '../../../../../ui/icon';
import { SessionTopComponent } from '../../../../../ui/session-top';
import { formatNumber } from '../number-input';

/** `number-guess`, `phase: 'resolved'`. Only the active player has `canGoNext`. */
@Component({
  selector: 'app-ng-result-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent, IconComponent],
  templateUrl: './result.view.html',
  styleUrl: './result.view.scss',
})
export class NumberGuessResultView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly nextRound = NumberGuess.nextRound;
  protected readonly skipRound = NumberGuess.skipRound;
  protected readonly format = formatNumber;

  /** The shell only renders this view for `number-guess`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.roundAs<NumberGuessRoundView>());

  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly nameOf = computed(() => this.store.nicknameOf());
  protected readonly circle = computed(() => this.store.game()?.circle.number ?? 1);
  protected readonly board = computed(() => this.store.scoreboard());
  protected readonly askedCount = computed(() => this.board().filter((score) => score.turns > 0).length);

  /** Closest first — the ranking is the result, so it is also the order. */
  protected readonly ranked = computed(() =>
    [...(this.round()?.guesses ?? [])].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)),
  );

  private readonly winners = computed(() => new Set(this.round()?.winnerIds ?? []));
  private readonly losers = computed(() => new Set(this.round()?.loserIds ?? []));

  protected readonly isWinner = computed(() => (playerId: string) => this.winners().has(playerId));
  protected readonly isLoser = computed(() => (playerId: string) => this.losers().has(playerId));

  protected readonly verdict = computed(() => {
    const round = this.round();
    if (!round) {
      return '';
    }
    const nameOf = this.nameOf();
    const names = (ids: string[]) => ids.map(nameOf).join(' and ');
    const winners = round.winnerIds;
    if (winners.length === 0) {
      return 'Nobody guessed this round.';
    }
    // an empty loser list means every guess was the same distance out — there is nothing to lose with
    if (round.loserIds.length === 0) {
      return winners.length === 1
        ? `${names(winners)} was the only one in, so the round is theirs.`
        : `${names(winners)} were all exactly as close. Everybody wins this one.`;
    }
    const closest = winners.length === 1 ? `${names(winners)} was closest` : `${names(winners)} tied for closest`;
    const furthest = round.loserIds.length === 1 ? `${names(round.loserIds)} was furthest off` : `${names(round.loserIds)} tied for furthest off`;
    return `${closest}. ${furthest}.`;
  });
}
