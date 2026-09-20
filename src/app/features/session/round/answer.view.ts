import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { DEFAULT_MAX_ANSWER_LENGTH, GameAction } from '../../../models';
import { SenReveal } from '../../../session/actions';
import { SessionStore } from '../../../session/session.store';
import { ConnectionState } from '../../../session/session.transport';
import { AnswersProgressComponent } from '../../../ui/answers-progress';
import { AvatarComponent } from '../../../ui/avatar';
import { IconComponent } from '../../../ui/icon';
import { SessionTopComponent } from '../../../ui/session-top';

/** RoundAnswer.dc.html — `phase: 'answering'`, the viewer is in `eligiblePlayerIds`. */
@Component({
  selector: 'app-answer-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AnswersProgressComponent, AvatarComponent, IconComponent],
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
            <div class="field-row">
              <label class="label" for="answer">Your answer</label>
              <span class="counter">{{ draft().length }}/{{ answerMax() }}</span>
            </div>
            <textarea
              id="answer"
              class="textarea answer__input"
              rows="4"
              [attr.maxlength]="answerMax()"
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
            ></textarea>
          </div>

          <div class="card card--quiet answer__seal">
            <app-icon name="lock" [size]="19" [width]="2.2" class="answer__sealIcon" />
            <span>
              Sealed until {{ asker() }} reveals. Not even {{ asker() }} can read it before then — and you can
              rewrite it right up to the moment.
            </span>
          </div>
        } @else {
          <div class="card card--dashed answer__watching">
            <app-icon name="lock" [size]="19" [width]="2.2" />
            <span>You are not answering this round. {{ asker() }} reveals when everyone is in.</span>
          </div>
        }

        <app-answers-progress
          [eligible]="round.eligiblePlayerIds"
          [answered]="round.answeredPlayerIds"
          [nameOf]="store.nicknameOf()"
        />

        <div class="spacer"></div>

        @if (round.canSubmitAnswer) {
          <button class="btn btn--primary" type="button" [disabled]="!canSend()" (click)="submit()">
            {{ round.myAnswer ? 'Change my answer' : 'Lock in my answer' }}
          </button>
          <p class="footnote">
            {{ round.myAnswer ? 'Already in. Rewrite it any time before the reveal.' : 'Once it’s in, this turns into “Change my answer”.' }}
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

    .answer__input {
      border: 2px solid var(--go);
      border-radius: var(--r-card);
      font-size: 18px;
      padding: 15px 16px;
    }

    .answer__seal,
    .answer__watching {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      font-size: 13.5px;
      line-height: 1.45;
      color: var(--text-2);
    }

    .answer__sealIcon {
      color: var(--go);
      margin-top: 1px;
    }

    .answer__watching {
      color: var(--muted);
    }
  `,
})
export class AnswerView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly circle = computed(() => this.store.game()?.circle.number ?? 1);
  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly answerMax = computed(() => this.store.settings()?.maxAnswerLength ?? DEFAULT_MAX_ANSWER_LENGTH);

  /** Seeded from `myAnswer` once per round, then the textarea is the player's own. */
  protected readonly draft = linkedSignal<number, string>({
    source: () => this.store.round()?.number ?? 0,
    computation: () => this.store.round()?.myAnswer ?? '',
  });

  protected readonly canSend = computed(() => {
    const value = this.draft().trim();
    return value.length > 0 && value !== this.store.round()?.myAnswer;
  });

  protected submit(): void {
    const value = this.draft().trim();
    if (!value) {
      return;
    }
    this.act.emit(SenReveal.submitAnswer(value));
  }
}
