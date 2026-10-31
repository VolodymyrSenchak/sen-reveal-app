import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, MAX_QUESTION_LENGTH } from '../../../../../models';
import { SenReveal } from '../../../../../session/actions';
import { seededSignal } from '../../../../../session/seeded-signal';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AnswersProgressComponent } from '../../../../../ui/answers-progress';
import { IconComponent } from '../../../../../ui/icon';
import { SessionTopComponent } from '../../../../../ui/session-top';

/** RoundActive.dc.html — `phase: 'answering'`, the viewer is `round.activePlayerId`. */
@Component({
  selector: 'app-ask-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AnswersProgressComponent, IconComponent],
  templateUrl: './ask.view.html',
  styleUrl: './ask.view.scss',
})
export class AskView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly questionMax = MAX_QUESTION_LENGTH;
  protected readonly reveal = SenReveal.reveal;
  protected readonly skipRound = SenReveal.skipRound;

  protected readonly circle = computed(() => this.store.game()?.circle.number ?? 1);

  /**
   * Reseeded whenever the round number changes, and left alone otherwise — so a snapshot
   * arriving mid-sentence does not wipe it.
   */
  protected readonly draft = seededSignal(
    () => this.store.round()?.number ?? 0,
    () => this.store.round()?.question ?? '',
  );

  protected readonly canShowQuestion = computed(() => this.draft().trim() !== (this.store.round()?.question ?? ''));

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
      return 'Nothing has come in yet. When it does, nobody sees it — you included.';
    }
    const noun = count === 1 ? 'answer is' : 'answers are';
    return `${count} ${noun} sitting sealed. Nobody has seen a single one — you included.`;
  });

  protected showQuestion(): void {
    // an empty string resets the question to null, which brings the out-loud placeholder back
    this.act.emit(SenReveal.setQuestion(this.draft().trim()));
  }
}
