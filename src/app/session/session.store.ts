import { computed, Injectable, signal } from '@angular/core';
import { GameViewBase, RoundViewBase, SessionPlayerView, SessionView } from '../models';

export type GameSession = SessionView<GameViewBase>;

/**
 * One signal holds the server's view; everything else is `computed`.
 *
 * Nothing here derives game rules. Whether a button exists is `round.canReveal`, not
 * "am I the asker and has everyone answered" — the server already decided that for this viewer.
 *
 * It is typed on what every game shares. A game's own screens reach their extra fields through
 * `gameAs` / `roundAs`, which is sound because the shell picks those screens by `gameType`.
 */
@Injectable()
export class SessionStore {
  private readonly _view = signal<GameSession | null>(null);

  readonly view = this._view.asReadonly();
  readonly code = computed(() => this._view()?.code ?? null);
  readonly status = computed(() => this._view()?.status ?? null);
  readonly me = computed(() => this._view()?.me ?? null);
  readonly players = computed<SessionPlayerView[]>(() => this._view()?.players ?? []);
  readonly isHost = computed(() => this._view()?.me.isHost ?? false);
  readonly settings = computed(() => this._view()?.settings ?? null);
  readonly game = computed(() => this._view()?.game ?? null);
  readonly round = computed(() => this.game()?.round ?? null);
  readonly phase = computed(() => this.round()?.phase ?? null);
  readonly scoreboard = computed(() => this.game()?.scoreboard ?? []);
  readonly isAsker = computed(() => {
    const round = this.round();
    const me = this.me();
    return !!round && !!me && round.activePlayerId === me.playerId;
  });
  readonly pollIntervalMs = computed(() => this._view()?.poll.intervalMs ?? 3000);

  /** Read inside a `computed` in a screen that the shell only ever renders for that game. */
  gameAs<T extends GameViewBase>(): T | null {
    return this.game() as T | null;
  }

  roundAs<T extends RoundViewBase>(): T | null {
    return this.round() as T | null;
  }

  /** Ids on the wire, names on the screen. */
  private readonly byId = computed(() => new Map(this.players().map((player) => [player.id, player])));

  /** A player who left mid-round is gone from `players` but may still own an answer. */
  readonly nicknameOf = computed(() => {
    const players = this.byId();
    return (playerId: string | null | undefined): string =>
      !playerId ? '' : (players.get(playerId)?.nickname ?? '(left)');
  });

  readonly askerNickname = computed(() => {
    const round = this.round();
    return round ? this.nicknameOf()(round.activePlayerId) : '';
  });

  /**
   * Version guard: never go backwards. The comparison is `<`, not `<=` — presence updates
   * deliberately do not bump `version`, so an online/offline change arrives as a new snapshot
   * at the same version. Dropping equal versions would freeze the presence dots.
   */
  apply(next: GameSession): void {
    const current = this._view();
    if (current && next.version < current.version) {
      return;
    }
    // Replace, never merge: the snapshot is already projected for this viewer, and a merge
    // would keep fields the server intentionally dropped (`round.answers` back to null, say).
    this._view.set(next);
  }

  reset(): void {
    this._view.set(null);
  }
}
