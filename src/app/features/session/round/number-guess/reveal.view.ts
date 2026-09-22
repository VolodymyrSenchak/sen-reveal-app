import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { GameAction, NumberGuessRoundView } from '../../../../models';
import { NumberGuess } from '../../../../session/actions';
import { SessionStore } from '../../../../session/session.store';
import { ConnectionState } from '../../../../session/session.transport';
import { AvatarComponent } from '../../../../ui/avatar';
import { SessionTopComponent } from '../../../../ui/session-top';
import { formatNumber, parseGuess } from './number-input';

/**
 * `number-guess`, `phase: 'revealed'`. Everyone sees the same numbers; only the active player
 * (`canSetCorrectAnswer`) gets the box for the right one — and typing it is what scores the round.
 * Nobody votes.
 */
@Component({
  selector: 'app-ng-reveal-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent],
  template: `
    @if (round(); as round) {
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
          @if (round.canSetCorrectAnswer) {
            <h1 class="reveal__title">Now the right answer</h1>
            <p class="reveal__lede">
              Type it in, {{ store.me()?.nickname }}. The game works out who is closest and who is furthest —
              you don't pick anyone.
            </p>
          } @else {
            <h1 class="reveal__title">The guesses</h1>
            <p class="reveal__lede">{{ asker() }} is entering the right answer.</p>
          }
        </div>

        <ul class="reveal__cards" aria-live="polite">
          @for (guess of guesses(); track guess.playerId; let i = $index) {
            <li class="guessCard" [style.--delay.ms]="i * 180">
              <app-avatar [nickname]="nameOf()(guess.playerId)" [size]="30" />
              <span class="guessCard__name">{{ nameOf()(guess.playerId) }}</span>
              <span class="guessCard__value mono">{{ format(guess.value) }}</span>
            </li>
          }
        </ul>

        <div class="spacer"></div>

        @if (round.canSetCorrectAnswer) {
          <div class="stack">
            <label class="label" for="answer">The right answer</label>
            <input
              id="answer"
              class="input reveal__answer mono"
              type="number"
              inputmode="decimal"
              autocomplete="off"
              step="any"
              placeholder="0"
              [class.input--invalid]="!!error()"
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
              (keydown.enter)="confirm()"
            />
            @if (error(); as message) {
              <span class="field-error">{{ message }}</span>
            }
          </div>
          <button class="btn btn--primary" type="button" [disabled]="!canConfirm()" (click)="confirm()">
            Score the round
          </button>
          <p class="footnote">Final — no take-backs. Everyone is looking at the same {{ guesses().length }} numbers.</p>
        } @else {
          <p class="footnote">Nothing for you to do but defend your number out loud.</p>
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
    .guessCard {
      border: 1.5px solid var(--line);
      border-radius: var(--r-card);
      background: var(--card);
      padding: 12px 15px;
      display: flex;
      align-items: center;
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

    .guessCard__name {
      flex-grow: 1;
      min-width: 0;
      font-size: 15px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .guessCard__value {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .reveal__answer {
      height: 66px;
      border: 2px solid var(--go);
      border-radius: var(--r-card);
      font-size: 30px;
      letter-spacing: -0.5px;
      text-align: center;
      appearance: textfield;
    }

    .reveal__answer.input--invalid {
      border-color: var(--worst);
    }

    .reveal__answer::-webkit-outer-spin-button,
    .reveal__answer::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }
  `,
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
  protected readonly draft = linkedSignal<number, string>({
    source: () => this.round()?.number ?? 0,
    computation: () => '',
  });

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
