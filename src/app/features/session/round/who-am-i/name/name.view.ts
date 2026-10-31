import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, MAX_NAME_LENGTH, WhoAmIView } from '../../../../../models';
import { WhoAmI } from '../../../../../session/actions';
import { seededSignal } from '../../../../../session/seeded-signal';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AnswersProgressComponent } from '../../../../../ui/answers-progress';
import { AvatarComponent } from '../../../../../ui/avatar';
import { IconComponent } from '../../../../../ui/icon';
import { SessionTopComponent } from '../../../../../ui/session-top';

/** `who-am-i`, `canSubmitName`: the viewer still owes their target a name. The table stays shut until they give it. */
@Component({
  selector: 'app-wai-name-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AnswersProgressComponent, AvatarComponent, IconComponent],
  templateUrl: './name.view.html',
  styleUrl: './name.view.scss',
})
export class WhoAmINameView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly nameMax = MAX_NAME_LENGTH;

  /** The shell only renders this view for `who-am-i`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.gameAs<WhoAmIView>()?.round ?? null);

  protected readonly target = computed(() => this.store.nicknameOf()(this.round()?.myTargetId));

  /** Cleared on a new round, and when a leaver hands the viewer a different target mid-round. */
  protected readonly draft = seededSignal(
    () => `${this.round()?.number ?? 0}:${this.round()?.myTargetId ?? ''}`,
    () => '',
  );

  protected readonly canSend = computed(() => {
    const name = this.draft().trim();
    return name.length > 0 && name.length <= MAX_NAME_LENGTH;
  });

  protected submit(): void {
    if (!this.canSend()) {
      return;
    }
    this.act.emit(WhoAmI.submitName(this.draft().trim()));
  }
}
