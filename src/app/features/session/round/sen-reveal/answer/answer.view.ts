import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DEFAULT_MAX_ANSWER_LENGTH, GameAction, SenRevealRoundView } from '../../../../../models';
import { SenReveal } from '../../../../../session/actions';
import { seededSignal } from '../../../../../session/seeded-signal';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AnswersProgressComponent } from '../../../../../ui/answers-progress';
import { AvatarComponent } from '../../../../../ui/avatar';
import { IconComponent } from '../../../../../ui/icon';
import { SessionTopComponent } from '../../../../../ui/session-top';

/** RoundAnswer.dc.html — `phase: 'answering'`, the viewer is in `eligiblePlayerIds`. */
@Component({
  selector: 'app-answer-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AnswersProgressComponent, AvatarComponent, IconComponent],
  templateUrl: './answer.view.html',
  styleUrl: './answer.view.scss',
})
export class AnswerView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  /** The shell only renders this view for `sen-reveal`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.roundAs<SenRevealRoundView>());

  protected readonly circle = computed(() => this.store.game()?.circle.number ?? 1);
  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly answerMax = computed(() => this.store.settings()?.maxAnswerLength ?? DEFAULT_MAX_ANSWER_LENGTH);

  /** Seeded from `myAnswer` once per round, then the textarea is the player's own. */
  protected readonly draft = seededSignal(
    () => this.round()?.number ?? 0,
    () => this.round()?.myAnswer ?? '',
  );

  protected readonly canSend = computed(() => {
    const value = this.draft().trim();
    return value.length > 0 && value !== this.round()?.myAnswer;
  });

  protected submit(): void {
    const value = this.draft().trim();
    if (!value) {
      return;
    }
    this.act.emit(SenReveal.submitAnswer(value));
  }
}
