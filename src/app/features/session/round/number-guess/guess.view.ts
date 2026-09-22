import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { GameAction, NumberGuessRoundView } from '../../../../models';
import { NumberGuess } from '../../../../session/actions';
import { SessionStore } from '../../../../session/session.store';
import { ConnectionState } from '../../../../session/session.transport';
import { AnswersProgressComponent } from '../../../../ui/answers-progress';
import { AvatarComponent } from '../../../../ui/avatar';
import { IconComponent } from '../../../../ui/icon';
import { SessionTopComponent } from '../../../../ui/session-top';
import { formatNumber, parseGuess } from './number-input';

/** `number-guess`, `phase: 'answering'`, the viewer is in `eligiblePlayerIds`. */
@Component({
  selector: 'app-ng-guess-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AnswersProgressComponent, AvatarComponent, IconComponent],
  template: `
    @if (round(); as round) {
      <div class="screen">
        <app-session-top
          [code]="store.code() ?? ''"
          [subtitle]="'Round ' + round.number + ' · Circle ' + circle()"
          [banner]="banner()"
          [pollIntervalMs]="store.pollIntervalMs()"
          [toast]="toast()"
          (exit)="exit.emit()"
        />

        <section class="question" [class.question--outLoud]="!round.question">
          <div class="question__asker">
            <app-avatar [nickname]="asker()" [isHost]="true" [size]="34" />
            <span class="question__askerName">
              {{ round.question ? asker() + ' asks' : 'No question typed' }}
            </span>
          </div>
          <p class="question__text">
            {{ round.question ?? asker() + ' is asking out loud — listen up.' }}
          </p>
        </section>

        @if (round.canSubmitAnswer) {
          <div class="stack">
            <label class="label" for="guess">Your number</label>
            <input
              id="guess"
              class="input guess__input mono"
              type="number"
              inputmode="decimal"
              autocomplete="off"
              step="any"
              placeholder="0"
              [class.input--invalid]="!!error()"
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
              (keydown.enter)="submit()"
            />
            @if (error(); as message) {
              <span class="field-error">{{ message }}</span>
            } @else {
              <span class="hint">A whole number or a decimal. Closest to the right answer wins the round.</span>
            }
          </div>

          <div class="card card--quiet guess__seal">
            <app-icon name="lock" [size]="19" [width]="2.2" class="guess__sealIcon" />
            <span>
              Sealed until {{ asker() }} reveals. Not even {{ asker() }} can see it before then — and you can change
              it right up to the moment.
            </span>
          </div>
        } @else {
          <div class="card card--dashed guess__watching">
            <app-icon name="lock" [size]="19" [width]="2.2" />
            <span>You are not guessing this round. {{ asker() }} reveals when everyone is in.</span>
          </div>
        }

        <app-answers-progress
          [eligible]="round.eligiblePlayerIds"
          [answered]="round.answeredPlayerIds"
          [nameOf]="store.nicknameOf()"
          title="Numbers in"
          waiting="is picking a number…"
        />

        <div class="spacer"></div>

        @if (round.canSubmitAnswer) {
          <button class="btn btn--primary" type="button" [disabled]="!canSend()" (click)="submit()">
            {{ round.myGuess !== null ? 'Change my number' : 'Lock in my number' }}
          </button>
          <p class="footnote">
            @if (round.myGuess !== null) {
              {{ formatNumber(round.myGuess) }} is in. Change it any time before the reveal.
            } @else {
              Once it’s in, this turns into “Change my number”.
            }
          </p>
        }
      </div>
    }
  `,
  styles: `
    .question {
      border: 1.5px solid var(--line);
      border-radius: var(--r-card-lg);
      background: var(--card);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .question--outLoud {
      border-style: dashed;
      border-color: var(--line-strong);
    }

    .question__asker {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .question__askerName {
      font-size: 14px;
      font-weight: 600;
      color: var(--muted);
    }

    .question__text {
      font-family: var(--font-display);
      font-size: 25px;
      line-height: 1.18;
      font-weight: 700;
      letter-spacing: -0.5px;
      overflow-wrap: anywhere;
    }

    .question--outLoud .question__text {
      font-size: 21px;
      line-height: 1.2;
      color: var(--muted);
    }

    /* One number, centred and big: on a phone this is the whole screen's job. */
    .guess__input {
      height: 74px;
      border: 2px solid var(--go);
      border-radius: var(--r-card);
      font-size: 34px;
      letter-spacing: -0.5px;
      text-align: center;
      padding: 0 16px;
    }

    .guess__input.input--invalid {
      border-color: var(--worst);
    }

    /* the spinner arrows would fight a 34px centred figure */
    .guess__input::-webkit-outer-spin-button,
    .guess__input::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }

    .guess__input {
      appearance: textfield;
    }

    .guess__seal,
    .guess__watching {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      font-size: 13.5px;
      line-height: 1.45;
      color: var(--text-2);
    }

    .guess__sealIcon {
      color: var(--go);
      margin-top: 1px;
    }

    .guess__watching {
      color: var(--muted);
    }
  `,
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
  protected readonly draft = linkedSignal<number, string>({
    source: () => this.round()?.number ?? 0,
    computation: () => {
      const mine = this.round()?.myGuess;
      return mine === null || mine === undefined ? '' : String(mine);
    },
  });

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
