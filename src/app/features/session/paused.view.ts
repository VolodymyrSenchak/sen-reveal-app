import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, MIN_PLAYERS } from '../../models';
import { Lobby } from '../../session/actions';
import { SessionStore } from '../../session/session.store';
import { ConnectionState } from '../../session/session.transport';
import { AvatarComponent } from '../../ui/avatar';
import { IconComponent } from '../../ui/icon';
import { SessionTopComponent } from '../../ui/session-top';

/**
 * `round === null` mid-game: fewer than `minPlayers` are still active, so the server paused the
 * circle (`pausedReason: 'not-enough-players'`). The design has no panel for this one yet —
 * this borrows the lobby's "needs 3 players" copy, which is the closest thing it does have.
 */
@Component({
  selector: 'app-paused-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent, IconComponent],
  template: `
    <div class="screen">
      <app-session-top
        [code]="store.code() ?? ''"
        subtitle="Paused"
        [banner]="banner()"
        [pollIntervalMs]="store.pollIntervalMs()"
        [toast]="toast()"
        (exit)="exit.emit()"
      />

      <div class="paused__card">
        <app-icon name="clock" [size]="30" [width]="2.1" />
        <h1 class="paused__title">Waiting for one more</h1>
        <p class="paused__copy">{{ copy() }}</p>
      </div>

      <div class="field-row">
        <h2 class="paused__sectionTitle">Still here</h2>
        <span class="paused__count">{{ store.players().length }} of {{ minPlayers() }} needed</span>
      </div>

      <ul class="paused__players">
        @for (player of store.players(); track player.id) {
          <li class="paused__player">
            <app-avatar
              [nickname]="player.nickname"
              [isHost]="player.isHost"
              [isOnline]="player.isOnline"
              [showDot]="true"
            />
            <span class="paused__name">{{ player.nickname }}</span>
            @if (player.isHost) {
              <span class="tag tag--soon">Host</span>
            }
          </li>
        }
      </ul>

      <div class="spacer"></div>

      <p class="footnote">
        The code still works — anyone who rejoins is dealt straight back into the circle.
      </p>

      @if (store.isHost()) {
        <button class="btn btn--danger" type="button" (click)="act.emit(end())">End the game</button>
      }
    </div>
  `,
  styles: `
    .paused__card {
      border: 1.5px solid var(--line);
      border-radius: var(--r-card-lg);
      background: var(--card);
      padding: 22px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
      color: var(--muted);
    }

    .paused__title {
      font-size: 22px;
      color: var(--text);
    }

    .paused__copy {
      font-size: 13.5px;
      line-height: 1.45;
    }

    .paused__sectionTitle {
      font-size: 18px;
      font-weight: 700;
    }

    .paused__count {
      font-size: 13px;
      color: var(--muted);
    }

    .paused__players {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .paused__player {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--r-field);
      background: var(--card);
      border: 1.5px solid var(--line);
    }

    .paused__name {
      flex-grow: 1;
      font-size: 16px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
  `,
})
export class PausedView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly end = Lobby.end;

  protected readonly minPlayers = computed(() => this.store.settings()?.minPlayers ?? MIN_PLAYERS);

  protected readonly copy = computed(() => {
    const have = this.store.players().length;
    const need = Math.max(1, this.minPlayers() - have);
    const plural = have === 1 ? 'player' : 'players';
    return `${have} ${plural} left in the room. ${need} more and the round picks up where it stopped.`;
  });
}
