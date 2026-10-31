import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, MIN_PLAYERS, WhoAmIView } from '../../../../../models';
import { WhoAmI } from '../../../../../session/actions';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AvatarComponent } from '../../../../../ui/avatar';
import { IconComponent } from '../../../../../ui/icon';
import { SessionTopComponent } from '../../../../../ui/session-top';

/**
 * `who-am-i`, the table: every card but the viewer's own while `playing`, all of them once
 * `revealed`. Nothing to do here but talk — only the host has buttons (reveal, then a new round).
 */
@Component({
  selector: 'app-wai-board-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent, IconComponent],
  templateUrl: './board.view.html',
  styleUrl: './board.view.scss',
})
export class WhoAmIBoardView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly reveal = WhoAmI.reveal;
  protected readonly nextRound = WhoAmI.nextRound;

  /** The shell only renders this view for `who-am-i`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.gameAs<WhoAmIView>()?.round ?? null);

  protected readonly revealed = computed(() => this.round()?.phase === 'revealed');
  protected readonly nameOf = computed(() => this.store.nicknameOf());
  protected readonly host = computed(() => this.nameOf()(this.store.view()?.hostPlayerId));
  protected readonly minPlayers = computed(() => this.store.settings()?.minPlayers ?? MIN_PLAYERS);

  protected readonly revealHint = computed(() => {
    const round = this.round();
    const missing = round ? round.eligiblePlayerIds.length - round.answeredPlayerIds.length : 0;
    if (missing === 0) {
      return 'Everyone flips at once — including the card on you.';
    }
    return missing === 1
      ? '1 name is still missing. That card stays blank if you reveal now.'
      : `${missing} names are still missing. Those cards stay blank if you reveal now.`;
  });
}
