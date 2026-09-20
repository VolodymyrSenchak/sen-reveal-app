import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { GameAction } from '../../../models';
import { SenReveal } from '../../../session/actions';
import { SessionStore } from '../../../session/session.store';
import { ConnectionState } from '../../../session/session.transport';
import { AvatarComponent } from '../../../ui/avatar';
import { IconComponent } from '../../../ui/icon';
import { SessionTopComponent } from '../../../ui/session-top';

/** Result.dc.html — `phase: 'resolved'`. Only the asker has `canGoNext`. */
@Component({
  selector: 'app-result-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent, IconComponent],
  template: `
    @if (store.round(); as round) {
      <div class="screen">
        <app-session-top
          [code]="store.code() ?? ''"
          [subtitle]="'Round ' + round.number + ' · result'"
          [banner]="banner()"
          [pollIntervalMs]="store.pollIntervalMs()"
          [toast]="toast()"
          (exit)="exit.emit()"
        />

        @if (winner(); as best) {
          <section class="best">
            <div class="best__label">
              <app-icon name="crown" [size]="18" [width]="2.4" />
              <span>Best answer</span>
            </div>
            <p class="best__text">{{ best.value }}</p>
            <div class="best__who">
              <span class="best__tile">{{ initial(nameOf()(best.playerId)) }}</span>
              <span class="best__name">{{ nameOf()(best.playerId) }}</span>
            </div>
          </section>
        }

        @if (loser(); as worst) {
          <section class="worst">
            <span class="worst__label">Worst answer</span>
            <p class="worst__text">{{ worst.value }}</p>
            <div class="worst__who">
              <app-avatar [nickname]="nameOf()(worst.playerId)" [size]="26" />
              <span class="worst__name">{{ nameOf()(worst.playerId) }}</span>
            </div>
          </section>
        }

        <button type="button" class="result__toggle" (click)="showAll.set(!showAll())">
          <span>{{ showAll() ? 'Hide the other answers' : 'See all ' + answers().length + ' answers again' }}</span>
          <app-icon name="chevron-right" [size]="17" [width]="2.4" />
        </button>

        @if (showAll()) {
          <ul class="result__all">
            @for (answer of answers(); track answer.playerId) {
              <li class="result__answer">
                <span class="result__answerName">{{ nameOf()(answer.playerId) }}</span>
                <span class="result__answerText">{{ answer.value }}</span>
              </li>
            }
          </ul>
        }

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
    .best {
      border-radius: var(--r-card-lg);
      background: var(--go);
      color: var(--room);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .best__label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .best__text {
      font-family: var(--font-display);
      font-size: 24px;
      line-height: 1.18;
      font-weight: 800;
      letter-spacing: -0.5px;
      overflow-wrap: anywhere;
    }

    .best__who {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .best__tile {
      width: 28px;
      height: 28px;
      border-radius: 9px;
      background: var(--room);
      color: var(--go);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 700;
    }

    .best__name {
      font-size: 15px;
      font-weight: 600;
    }

    .worst {
      border: 2px solid var(--worst);
      border-radius: var(--r-card-lg);
      background: var(--card);
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .worst__label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--worst);
    }

    .worst__text {
      font-size: 18px;
      line-height: 1.3;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .worst__who {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .worst__name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-2);
    }

    .result__toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: var(--tap);
      padding: 13px 16px;
      border-radius: var(--r-field);
      border: 1.5px solid var(--line);
      background: transparent;
      color: var(--text);
      font-size: 14.5px;
      font-weight: 600;
      cursor: pointer;
    }

    .result__all {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .result__answer {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 11px 14px;
      border-radius: var(--r-field);
      background: var(--card);
    }

    .result__answerName {
      font-size: 12.5px;
      color: var(--faint);
    }

    .result__answerText {
      font-size: 15.5px;
      line-height: 1.35;
      overflow-wrap: anywhere;
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
export class ResultView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly nextRound = SenReveal.nextRound;
  protected readonly skipRound = SenReveal.skipRound;

  protected readonly showAll = signal(false);

  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly nameOf = computed(() => this.store.nicknameOf());
  protected readonly circle = computed(() => this.store.game()?.circle.number ?? 1);
  protected readonly answers = computed(() => this.store.round()?.answers ?? []);
  protected readonly board = computed(() => this.store.scoreboard());
  protected readonly askedCount = computed(() => this.board().filter((score) => score.turns > 0).length);

  protected readonly winner = computed(() => this.findAnswer(this.store.round()?.winnerId));
  protected readonly loser = computed(() => this.findAnswer(this.store.round()?.loserId));

  protected initial(nickname: string): string {
    return nickname.trim().charAt(0).toUpperCase() || '?';
  }

  private findAnswer(playerId: string | null | undefined) {
    return playerId ? (this.answers().find((answer) => answer.playerId === playerId) ?? null) : null;
  }
}
