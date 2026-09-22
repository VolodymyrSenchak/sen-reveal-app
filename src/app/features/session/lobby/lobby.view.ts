import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { gameTitle } from '../../../core/games';
import { GameAction, MIN_PLAYERS } from '../../../models';
import { Lobby } from '../../../session/actions';
import { SessionStore } from '../../../session/session.store';
import { ConnectionState } from '../../../session/session.transport';
import { AvatarComponent } from '../../../ui/avatar';
import { ConnectionBannerComponent } from '../../../ui/connection-banner';
import { IconComponent } from '../../../ui/icon';

/** Lobby.dc.html — `status: 'pending'`. */
@Component({
  selector: 'app-lobby-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, IconComponent, ConnectionBannerComponent],
  template: `
    <div class="screen">
      <header class="session-head">
        <div>
          <div class="lobby__heading">Lobby</div>
          <div class="lobby__sub">{{ gameTitle() }} · waiting to start</div>
        </div>
        <button type="button" class="icon-btn icon-btn--outlined" aria-label="Leave the session" (click)="exit.emit()">
          <app-icon name="x" [size]="19" [width]="2.2" />
        </button>
      </header>

      <app-connection-banner [state]="banner()" [pollIntervalMs]="store.pollIntervalMs()" />

      <section class="lobby__code">
        <span class="eyebrow">Session code</span>
        <div class="lobby__digits" [attr.aria-label]="'Session code ' + spokenCode()">{{ store.code() }}</div>
        <div class="lobby__codeActions">
          <button type="button" class="btn btn--small" (click)="copyCode()">
            <app-icon name="copy" [size]="16" [width]="2.2" />
            {{ copiedCode() ? 'Copied' : 'Copy code' }}
          </button>
          <button type="button" class="btn btn--small" (click)="shareLink()">
            <app-icon name="share" [size]="16" [width]="2.2" />
            {{ copiedLink() ? 'Copied' : 'Share link' }}
          </button>
        </div>
        <div class="lobby__expiry">
          <app-icon name="clock" [size]="13" [width]="2.2" />
          <span>{{ expiryLine() }}</span>
        </div>
      </section>

      <div class="field-row">
        <h2 class="lobby__sectionTitle">In the room</h2>
        <span class="lobby__count">{{ store.players().length }} of {{ maxPlayers() }}</span>
      </div>

      <ul class="lobby__players">
        @for (player of store.players(); track player.id) {
          <li class="player" [class.player--offline]="!player.isOnline">
            <app-avatar
              [nickname]="player.nickname"
              [isHost]="player.isHost"
              [isOnline]="player.isOnline"
              [showDot]="true"
              [dotRing]="player.isOnline ? 'var(--card)' : 'var(--field)'"
            />
            <div class="player__text">
              <div class="player__name">
                {{ player.nickname }}
                @if (player.id === store.me()?.playerId) {
                  <span class="player__you">(you)</span>
                }
              </div>
              @if (player.isHost) {
                <div class="player__role">Host</div>
              } @else if (!player.isOnline) {
                <div class="player__meta">Offline — phone asleep</div>
              } @else {
                <div class="player__meta">Joined {{ joinedAgo(player.joinedAt) }}</div>
              }
            </div>
            @if (store.isHost() && player.id !== store.me()?.playerId) {
              <button
                type="button"
                class="icon-btn player__action"
                [attr.aria-label]="'Make ' + player.nickname + ' host'"
                (click)="act.emit(transferHost(player.id))"
              >
                <app-icon name="crown" [size]="19" [width]="2.2" />
              </button>
              <button
                type="button"
                class="icon-btn player__action player__action--danger"
                [attr.aria-label]="'Remove ' + player.nickname"
                (click)="act.emit(kick(player.id))"
              >
                <app-icon name="x" [size]="19" [width]="2.2" />
              </button>
            }
          </li>
        }
      </ul>

      @if (toast(); as message) {
        <p class="toast" role="status">{{ message }}</p>
      }

      <div class="spacer"></div>

      @if (store.isHost()) {
        <button class="btn btn--primary" type="button" [disabled]="!enoughPlayers()" (click)="act.emit(start())">
          Start the game
        </button>
        <p class="footnote">
          @if (enoughPlayers()) {
            Everyone else sees “Waiting for {{ store.me()?.nickname }} to start”.
          } @else {
            {{ waitingCopy() }}
          }
        </p>
      } @else {
        <div class="lobby__waiting">Waiting for {{ hostNickname() }} to start</div>
        <p class="footnote">
          @if (enoughPlayers()) {
            The host has everyone they need.
          } @else {
            {{ waitingCopy() }}
          }
        </p>
      }
    </div>
  `,
  styles: `
    .lobby__heading {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.4px;
    }

    .lobby__sub {
      font-size: 13px;
      color: var(--muted);
      margin-top: 1px;
    }

    .lobby__code {
      border: 1.5px solid var(--line);
      border-radius: var(--r-card-lg);
      background: var(--card);
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .lobby__digits {
      font-family: var(--font-mono);
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 7px;
      line-height: 1;
      color: var(--go);
      padding-left: 7px;
    }

    .lobby__codeActions {
      display: flex;
      gap: 8px;
      width: 100%;
    }

    .lobby__expiry {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: var(--faint);
    }

    .lobby__sectionTitle {
      font-size: 18px;
      font-weight: 700;
    }

    .lobby__count {
      font-size: 13px;
      color: var(--muted);
    }

    .lobby__players {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .player {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--r-field);
      background: var(--card);
      border: 1.5px solid var(--line);
    }

    .player--offline {
      background: var(--field);
      border-style: dashed;
    }

    .player__text {
      flex-grow: 1;
      min-width: 0;
    }

    .player__name {
      font-size: 16px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .player--offline .player__name {
      color: var(--muted);
    }

    .player__you {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--faint);
    }

    .player__role {
      font-size: 12.5px;
      color: var(--go);
    }

    .player__meta {
      font-size: 12.5px;
      color: var(--faint);
    }

    .player__action {
      color: var(--muted);
    }

    .player__action--danger {
      color: var(--worst);
    }

    .lobby__waiting {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60px;
      border-radius: var(--r-card);
      border: 1.5px dashed var(--line-strong);
      color: var(--muted);
      font-family: var(--font-display);
      font-size: 17px;
      font-weight: 700;
    }
  `,
})
export class LobbyView implements OnInit {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly start = Lobby.start;
  protected readonly kick = Lobby.kick;
  protected readonly transferHost = Lobby.transferHost;

  protected readonly gameTitle = computed(() => gameTitle(this.store.view()?.gameType));

  private readonly destroyRef = inject(DestroyRef);

  protected readonly copiedCode = signal(false);
  protected readonly copiedLink = signal(false);
  /** Ticks the countdown; the client clock never *acts* on expiry, it only displays it. */
  private readonly now = signal(Date.now());

  protected readonly maxPlayers = computed(() => this.store.settings()?.maxPlayers ?? 20);
  protected readonly minPlayers = computed(() => this.store.settings()?.minPlayers ?? MIN_PLAYERS);
  protected readonly enoughPlayers = computed(() => this.store.players().length >= this.minPlayers());
  protected readonly hostNickname = computed(() => this.store.nicknameOf()(this.store.view()?.hostPlayerId));
  protected readonly spokenCode = computed(() => (this.store.code() ?? '').split('').join(' '));

  protected readonly waitingCopy = computed(() => {
    const have = this.store.players().length;
    const need = this.minPlayers() - have;
    const plural = have === 1 ? 'player' : 'players';
    return `${have} ${plural} in the room. ${need} more and you can start.`;
  });

  protected readonly expiryLine = computed(() => {
    const view = this.store.view();
    if (!view) {
      return '';
    }
    // Displayed only. Expiry is the server's call, delivered as `session:expired` or a 410 —
    // a client whose clock is wrong must not lock itself out.
    const left = Date.parse(view.expiresAt) - this.now();
    if (!Number.isFinite(left) || left <= 0) {
      return 'expiring';
    }
    const hours = Math.floor(left / 3_600_000);
    const minutes = Math.floor((left % 3_600_000) / 60_000);
    return `expires in ${hours}h ${minutes}m`;
  });

  ngOnInit(): void {
    const timer = setInterval(() => this.now.set(Date.now()), 30_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  protected joinedAgo(iso: string): string {
    const minutes = Math.max(0, Math.round((this.now() - Date.parse(iso)) / 60_000));
    if (minutes < 1) {
      return 'just now';
    }
    return minutes === 1 ? '1 min ago' : `${minutes} min ago`;
  }

  protected async copyCode(): Promise<void> {
    await writeClipboard(this.store.code() ?? '', this.copiedCode);
  }

  protected async shareLink(): Promise<void> {
    await writeClipboard(`${location.origin}/join?code=${this.store.code()}`, this.copiedLink);
  }
}

async function writeClipboard(text: string, flag: { set(value: boolean): void }): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    flag.set(true);
    setTimeout(() => flag.set(false), 1500);
  } catch {
    /* blocked in some webviews; the code is on screen anyway */
  }
}
