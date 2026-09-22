/**
 * What every game's view has in common: a circle of rounds, a phase, who is eligible, who is in,
 * and a scoreboard. The session shell (store, transport, screen picker, lobby, paused) is written
 * against these types alone; only the round screens know which game they are showing.
 */

export type GamePhase = 'answering' | 'revealed' | 'resolved';

export interface ScoreView {
  playerId: string;
  wins: number;
  losses: number;
  turns: number;
}

export interface RoundViewBase {
  number: number;
  activePlayerId: string;
  phase: GamePhase;
  /** null → show the placeholder ("<nickname> is asking out loud"). */
  question: string | null;
  eligiblePlayerIds: string[];
  answeredPlayerIds: string[];
  startedAt: string;
  revealedAt: string | null;
  resolvedAt: string | null;
  canSetQuestion: boolean;
  canSubmitAnswer: boolean;
  canReveal: boolean;
  canForceReveal: boolean;
  canGoNext: boolean;
}

export interface GameViewBase<TRound extends RoundViewBase = RoundViewBase> {
  circle: { number: number };
  /** Non-null → fewer than `minPlayers` are active and `round` is null. */
  pausedReason: 'not-enough-players' | null;
  round: TRound | null;
  /** Active players, in join order. */
  scoreboard: ScoreView[];
  canSkipRound: boolean;
}

/** Limits shared by every game, mirrored so the UI can stop the user before the request does. */
export const MAX_QUESTION_LENGTH = 300;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;
export const NICKNAME_MAX_LENGTH = 20;
export const PASSWORD_MAX_LENGTH = 64;
