import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, MIN_PLAYERS, WhoAmIView } from '../../../../models';
import { WhoAmI } from '../../../../session/actions';
import { SessionStore } from '../../../../session/session.store';
import { ConnectionState } from '../../../../session/session.transport';
import { AvatarComponent } from '../../../../ui/avatar';
import { IconComponent } from '../../../../ui/icon';
import { SessionTopComponent } from '../../../../ui/session-top';

/**
 * `who-am-i`, the table: every card but the viewer's own while `playing`, all of them once
 * `revealed`. Nothing to do here but talk — only the host has buttons (reveal, then a new round).
 */
@Component({
  selector: 'app-wai-board-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent, IconComponent],
  template: `
    @if (round(); as round) {
      <div class="screen">
        <app-session-top
          [code]="store.code() ?? ''"
          [subtitle]="'Round ' + round.number + (revealed() ? ' · revealed' : ' · guessing')"
          [banner]="banner()"
          [pollIntervalMs]="store.pollIntervalMs()"
          [toast]="toast()"
          (exit)="exit.emit()"
        />

        <div>
          @if (revealed()) {
            <h1 class="board__title">Cards up</h1>
            <p class="board__lede">Everyone can see who they were.</p>
          } @else if (!round.isPlaying) {
            <h1 class="board__title">You're watching</h1>
            <p class="board__lede">You came in mid-round, so you see every card. You're dealt in next round.</p>
          } @else {
            <h1 class="board__title">Who are you?</h1>
            <p class="board__lede">Every card on the table but yours. Ask yes-or-no questions out loud to work it out.</p>
          }
        </div>

        <ul class="board__cards" aria-live="polite">
          @for (card of round.cards ?? []; track card.playerId) {
            <li
              class="whoCard"
              [class.whoCard--hidden]="card.isMine && !revealed()"
              [class.whoCard--mine]="card.isMine && revealed()"
              [class.whoCard--empty]="!card.name && !card.isMine"
            >
              <div class="whoCard__head">
                <app-avatar [nickname]="nameOf()(card.playerId)" [size]="28" />
                <span class="whoCard__player">
                  {{ nameOf()(card.playerId) }}
                  @if (card.isMine) {
                    <span class="whoCard__you">(you)</span>
                  }
                </span>
              </div>

              @if (card.isMine && !revealed()) {
                <div class="whoCard__hiddenBody">
                  <app-icon name="question" [size]="26" [width]="2.4" />
                  <span>Face down until {{ host() }} reveals</span>
                </div>
              } @else if (card.name) {
                <p class="whoCard__name">{{ card.name }}</p>
                <p class="whoCard__from">from {{ nameOf()(card.givenById) }}</p>
              } @else {
                <p class="whoCard__missing">{{ revealed() ? 'Nobody named them' : 'Waiting for a name…' }}</p>
              }
            </li>
          }
        </ul>

        <div class="spacer"></div>

        @if (round.canReveal) {
          <button class="btn btn--primary" type="button" (click)="act.emit(reveal())">
            <app-icon name="eye" [size]="19" [width]="2.4" />
            Reveal all cards
          </button>
          <p class="footnote">{{ revealHint() }}</p>
        } @else if (round.canStartNextRound) {
          <button class="btn btn--primary" type="button" (click)="act.emit(nextRound())">
            New round
            <app-icon name="arrow-right" [size]="19" [width]="2.6" />
          </button>
          <p class="footnote">Everyone gets a new person to name — latecomers included.</p>
        } @else if (revealed() && store.isHost()) {
          <p class="footnote">A new round needs at least {{ minPlayers() }} players in the room.</p>
        } @else if (revealed()) {
          <p class="footnote">{{ host() }} deals the next round.</p>
        } @else {
          <p class="footnote">{{ host() }} flips every card when you're done guessing.</p>
        }
      </div>
    }
  `,
  styles: `
    .board__title {
      font-size: 26px;
      letter-spacing: -0.6px;
    }

    .board__lede {
      margin-top: 3px;
      font-size: 13.5px;
      line-height: 1.4;
      color: var(--muted);
    }

    .board__cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .whoCard {
      border: 1.5px solid var(--line);
      border-radius: var(--r-card);
      background: var(--card);
      padding: 13px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .whoCard--hidden,
    .whoCard--empty {
      border-style: dashed;
      border-color: var(--line-strong);
      background: transparent;
    }

    /* The one card the viewer has been waiting all round to see. */
    .whoCard--mine {
      border: none;
      background: var(--go);
      color: var(--room);
      animation: land var(--t-reveal) ease-out backwards;
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

    .whoCard__head {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .whoCard__player {
      min-width: 0;
      font-size: 14px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .whoCard__you {
      font-size: 12px;
      font-weight: 500;
      opacity: 0.7;
    }

    .whoCard__name {
      font-family: var(--font-display);
      font-size: 20px;
      line-height: 1.2;
      font-weight: 700;
      letter-spacing: -0.3px;
      overflow-wrap: anywhere;
    }

    .whoCard__from {
      font-size: 12px;
      color: var(--faint);
    }

    .whoCard--mine .whoCard__from {
      color: inherit;
      opacity: 0.75;
    }

    .whoCard__hiddenBody {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      line-height: 1.35;
      color: var(--muted);
    }

    .whoCard__missing {
      font-size: 13.5px;
      color: var(--faint);
    }
  `,
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
