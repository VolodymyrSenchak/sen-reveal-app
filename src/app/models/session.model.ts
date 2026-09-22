/**
 * Hand-written mirror of the API's `SessionView` (sen-reveal-api `src/models/session.model.ts`
 * and `src/services/sessionView.ts`). This file is the contract: do not generate it and do not
 * import from the API package.
 */

export type GameType = 'sen-reveal' | 'number-guess' | 'who-am-i' | (string & {});

export type SessionStatus = 'pending' | 'in_progress' | 'finished';

/** Why a player is no longer active. `replaced` = a rejoining player took over the stale nickname. */
export type RemovalReason = 'left' | 'kicked' | 'replaced';

export interface SessionPlayerView {
  id: string;
  nickname: string;
  isHost: boolean;
  /** Server-computed (last seen < 30 s). Never tracked on the client. */
  isOnline: boolean;
  joinedAt: string;
}

export interface CoreSettingsView {
  maxPlayers: number;
  allowJoinInProgress: boolean;
  /** Every game adds its own settings here; these are the ones the UI reads. */
  minPlayers?: number;
  /** sen-reveal only. */
  maxAnswerLength?: number;
}

export interface SessionView<TGameView = unknown> {
  code: string;
  gameType: GameType;
  status: SessionStatus;
  version: number;
  createdAt: string;
  expiresAt: string;
  hostPlayerId: string;
  me: { playerId: string; nickname: string; isHost: boolean };
  /** Active players only, in join order. */
  players: SessionPlayerView[];
  settings: CoreSettingsView;
  poll: { intervalMs: number };
  game: TGameView | null;
}

export interface SessionInfo {
  code: string;
  gameType: GameType;
  status: SessionStatus;
  requiresPassword: boolean;
  playerCount: number;
  maxPlayers: number;
  joinable: boolean;
  expiresAt: string;
}

export interface PlayerSessionResult<TGameView = unknown> {
  playerId: string;
  playerToken: string;
  session: SessionView<TGameView>;
}

export interface CreateSessionBody {
  gameType: GameType;
  nickname: string;
  password?: string;
  settings?: Record<string, unknown>;
}

export interface JoinSessionBody {
  nickname: string;
  password?: string;
}

/** Wire shape of every action: `{ type: 'lobby.start' | 'sen-reveal.reveal' | …, payload }`. */
export interface GameAction {
  type: string;
  payload: Record<string, unknown>;
}
