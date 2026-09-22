import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, linkedSignal, output } from '@angular/core';
import { GameAction, MAX_QUESTION_LENGTH } from '../../../../models';
import { NumberGuess } from '../../../../session/actions';
import { SessionStore } from '../../../../session/session.store';
import { ConnectionState } from '../../../../session/session.transport';
import { AnswersProgressComponent } from '../../../../ui/answers-progress';
import { IconComponent } from '../../../../ui/icon';
import { SessionTopComponent } from '../../../../ui/session-top';

/** Typing the question sends one action per pause, not one per keystroke. */
const QUESTION_DEBOUNCE_MS = 500;

/** `number-guess`, `phase: 'answering'`, the viewer is `round.activePlayerId`. */
@Component({
  selector: 'app-ng-ask-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AnswersProgressComponent, IconComponent],
  template: `
    @if (store.round(); as round) {
      <div class="screen">
        <app-session-top
          [code]="store.code() ?? ''"
          [subtitle]="'Round ' + round.number + ' · Circle ' + circle()"
          [banner]="banner()"
          [pollIntervalMs]="store.pollIntervalMs()"
          [toast]="toast()"
          (exit)="exit.emit()"
        />

        <div class="card--accent ask__turn">
          <app-icon name="question" [size]="26" [width]="2.3" />
          <div>
            <div class="ask__turnTitle">Your turn to ask</div>
            <div class="ask__turnCopy">Ask something with a number for an answer — one you know.</div>
          </div>
        </div>

        <div class="stack">
          <div class="field-row">
            <label class="label" for="question">The question <span class="ask__optional">— optional</span></label>
            <span class="counter">{{ draft().length }}/{{ questionMax }}</span>
          </div>
          <textarea
            id="question"
            class="textarea"
            rows="3"
            [attr.maxlength]="questionMax"
            [disabled]="!round.canSetQuestion"
            [value]="draft()"
            (input)="onQuestion($event)"
          ></textarea>
          <span class="hint">
            Leave it empty and just ask out loud — everyone will see “{{ store.me()?.nickname }} is asking out loud”.
            You type the right number after the guesses are on the table.
          </span>
        </div>

        <app-answers-progress
          [eligible]="round.eligiblePlayerIds"
          [answered]="round.answeredPlayerIds"
          [nameOf]="store.nicknameOf()"
          title="Numbers in"
          waiting="is picking a number…"
        />

        <div class="card card--dashed ask__lock">
          <app-icon name="lock" [size]="21" [width]="2.2" />
          <span>{{ lockCopy() }}</span>
        </div>

        <div class="spacer"></div>

        @if (round.canReveal) {
          <button class="btn btn--primary" type="button" (click)="act.emit(reveal(false))">
            <app-icon name="eye" [size]="21" [width]="2.4" />
            Show the guesses
          </button>
        } @else {
          <!-- the design shows this one disabled rather than absent: it is the thing being waited on -->
          <button class="btn btn--primary" type="button" disabled>
            <app-icon name="eye" [size]="21" [width]="2.4" />
            Show the guesses
          </button>
          @if (round.canForceReveal) {
            <button class="btn btn--danger" type="button" (click)="act.emit(reveal(true))">
              Reveal without {{ missingLabel() }}
            </button>
            <span class="hint">
              Forcing needs at least one guess on the table. The missing player simply has no number.
            </span>
          }
        }

        @if (store.game()?.canSkipRound) {
          <button class="btn btn--quiet" type="button" (click)="act.emit(skipRound())">Skip this round</button>
        }
      </div>
    }
  `,
  styles: `
    .ask__turn {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .ask__turnTitle {
      font-family: var(--font-display);
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -0.4px;
    }

    .ask__turnCopy {
      font-size: 13.5px;
      margin-top: 1px;
    }

    .ask__optional {
      color: var(--faint);
      font-weight: 500;
    }

    .ask__lock {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 16px;
      font-size: 13.5px;
      line-height: 1.4;
      color: var(--muted);
    }
  `,
})
export class NumberGuessAskView {
  protected readonly store = inject(SessionStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly questionMax = MAX_QUESTION_LENGTH;
  protected readonly reveal = NumberGuess.reveal;
  protected readonly skipRound = NumberGuess.skipRound;

  protected readonly circle = computed(() => this.store.game()?.circle.number ?? 1);

  /**
   * Reseeded whenever the round number changes, and left alone otherwise — so a snapshot
   * arriving mid-sentence does not yank the caret back.
   */
  protected readonly draft = linkedSignal<number, string>({
    source: () => this.store.round()?.number ?? 0,
    computation: () => this.store.round()?.question ?? '',
  });

  protected readonly missing = computed(() => {
    const round = this.store.round();
    if (!round) {
      return [];
    }
    const answered = new Set(round.answeredPlayerIds);
    return round.eligiblePlayerIds.filter((id) => !answered.has(id));
  });

  protected readonly missingLabel = computed(() => {
    const missing = this.missing();
    const nameOf = this.store.nicknameOf();
    if (missing.length === 1) {
      return nameOf(missing[0]);
    }
    return `${missing.length} players`;
  });

  protected readonly lockCopy = computed(() => {
    const count = this.store.round()?.answeredPlayerIds.length ?? 0;
    if (count === 0) {
      return 'No numbers yet. When they come in, nobody sees them — you included.';
    }
    const noun = count === 1 ? 'number is' : 'numbers are';
    return `${count} ${noun} sitting sealed. Nobody has seen a single one — you included.`;
  });

  private debounce: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearDebounce());
  }

  protected onQuestion(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.draft.set(text);
    this.clearDebounce();
    this.debounce = setTimeout(() => {
      this.debounce = null;
      // an empty string resets the question to null, which brings the out-loud placeholder back
      this.act.emit(NumberGuess.setQuestion(text.trim()));
    }, QUESTION_DEBOUNCE_MS);
  }

  private clearDebounce(): void {
    if (this.debounce !== null) {
      clearTimeout(this.debounce);
      this.debounce = null;
    }
  }
}
