import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, NumberGuessRoundView } from '../../../../models';
import { NumberGuess } from '../../../../session/actions';
import { SessionStore } from '../../../../session/session.store';
import { ConnectionState } from '../../../../session/session.transport';
import { AvatarComponent } from '../../../../ui/avatar';
import { IconComponent } from '../../../../ui/icon';
import { SessionTopComponent } from '../../../../ui/session-top';
import { formatNumber } from './number-input';

/** `number-guess`, `phase: 'resolved'`. Only the active player has `canGoNext`. */
@Component({
  selector: 'app-ng-result-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent, IconComponent],
  template: `
    @if (round(); as round) {
      <div class="screen">
        <app-session-top
          [code]="store.code() ?? ''"
          [subtitle]="'Round ' + round.number + ' · result'"
          [banner]="banner()"
          [pollIntervalMs]="store.pollIntervalMs()"
          [toast]="toast()"
          (exit)="exit.emit()"
        />

        <section class="answer">
          <div class="answer__label">
            <app-icon name="check" [size]="18" [width]="2.6" />
            <span>The right answer</span>
          </div>
          <p class="answer__value mono">{{ format(round.correctAnswer ?? 0) }}</p>
          @if (round.question) {
            <p class="answer__question">{{ round.question }}</p>
          }
        </section>

        <p class="result__verdict">{{ verdict() }}</p>

        <ul class="result__cards">
          @for (guess of ranked(); track guess.playerId) {
            <li
              class="rank"
              [class.rank--best]="isWinner()(guess.playerId)"
              [class.rank--worst]="isLoser()(guess.playerId)"
            >
              <app-avatar [nickname]="nameOf()(guess.playerId)" [size]="30" />
              <div class="rank__text">
                <div class="rank__name">
                  {{ nameOf()(guess.playerId) }}
                  @if (guess.playerId === store.me()?.playerId) {
                    <span class="rank__you">(you)</span>
                  }
                </div>
                <div class="rank__off">off by {{ format(guess.distance ?? 0) }}</div>
              </div>
              <span class="rank__value mono">{{ format(guess.value) }}</span>
              @if (isWinner()(guess.playerId)) {
                <span class="tag tag--ready">Closest</span>
              } @else if (isLoser()(guess.playerId)) {
                <span class="tag rank__tagWorst">Furthest</span>
              }
            </li>
          }
        </ul>

        <section class="board">
          <div class="field-row">
            <h2 class="board__title">Scoreboard</h2>
            <span class="board__meta">Circle {{ circle() }} · {{ askedCount() }} of {{ board().length }} have asked</span>
          </div>

          <div class="board__row board__row--head">
            <span class="board__player">Player</span>
            <span class="board__cell">Best</span>
            <span class="board__cell">Worst</span>
            <span class="board__cell">Asks</span>
          </div>

          @for (score of board(); track score.playerId) {
            <div class="board__row">
              <span class="board__player">
                {{ nameOf()(score.playerId) }}
                @if (score.playerId === store.me()?.playerId) {
                  <span class="board__you">(you)</span>
                }
              </span>
              <span class="board__cell mono" [class.board__cell--best]="score.wins > 0">{{ score.wins }}</span>
              <span class="board__cell mono" [class.board__cell--worst]="score.losses > 0">{{ score.losses }}</span>
              <span class="board__cell mono">{{ score.turns }}</span>
            </div>
          }
        </section>

        <div class="spacer"></div>

        @if (round.canGoNext) {
          <button class="btn btn--primary" type="button" (click)="act.emit(nextRound())">
            Next round
            <app-icon name="arrow-right" [size]="19" [width]="2.6" />
          </button>
          <p class="footnote">Only you can move on — everyone else keeps the result on screen until you do.</p>
        } @else {
          <p class="footnote">{{ asker() }} moves the circle on. Sit tight.</p>
        }

        @if (store.game()?.canSkipRound && !round.canGoNext) {
          <button class="btn btn--quiet" type="button" (click)="act.emit(skipRound())">Skip ahead</button>
        }
      </div>
    }
  `,
  styles: `
    .answer {
      border-radius: var(--r-card-lg);
      background: var(--go);
      color: var(--room);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      text-align: center;
      align-items: center;
    }

    .answer__label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .answer__value {
      font-size: 46px;
      line-height: 1.05;
      font-weight: 700;
      letter-spacing: -1.5px;
      overflow-wrap: anywhere;
    }

    .answer__question {
      font-size: 13.5px;
      line-height: 1.35;
      font-weight: 600;
      opacity: 0.75;
      overflow-wrap: anywhere;
    }

    .result__verdict {
      font-size: 14.5px;
      line-height: 1.4;
      color: var(--text-2);
    }

    .result__cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .rank {
      border: 1.5px solid var(--line);
      border-radius: var(--r-card);
      background: var(--card);
      padding: 11px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .rank--best {
      border: 2px solid var(--go);
    }

    .rank--worst {
      border: 2px solid var(--worst);
    }

    .rank__text {
      flex-grow: 1;
      min-width: 0;
    }

    .rank__name {
      font-size: 15px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .rank__you {
      font-size: 12px;
      font-weight: 500;
      color: var(--faint);
    }

    .rank__off {
      font-size: 12.5px;
      color: var(--faint);
    }

    .rank__value {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.4px;
    }

    .rank__tagWorst {
      background: var(--worst);
      color: var(--room);
    }

    .board {
      border: 1.5px solid var(--line);
      border-radius: 20px;
      background: var(--card);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .board__title {
      font-size: 17px;
      font-weight: 700;
    }

    .board__meta {
      font-size: 12.5px;
      color: var(--faint);
    }

    .board__row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 0;
      border-top: 1px solid var(--chip);
    }

    .board__row--head {
      border-top: none;
      padding-bottom: 0;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--faint);
    }

    .board__player {
      flex-grow: 1;
      min-width: 0;
      font-size: 15px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .board__row--head .board__player {
      font-size: inherit;
      font-weight: 600;
    }

    .board__you {
      font-size: 12px;
      font-weight: 500;
      color: var(--faint);
    }

    .board__cell {
      width: 34px;
      flex-shrink: 0;
      text-align: center;
      font-size: 15px;
      color: var(--muted);
    }

    .board__row--head .board__cell {
      font-size: inherit;
    }

    .board__cell--best {
      color: var(--go);
    }

    .board__cell--worst {
      color: var(--worst);
    }
  `,
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
