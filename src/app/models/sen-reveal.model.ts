/** Mirror of the API's `SenRevealView` (sen-reveal-api `src/games/sen-reveal/senReveal.projection.ts`). */

export type SenRevealPhase = 'answering' | 'revealed' | 'resolved';

export interface SenRevealScoreView {
  playerId: string;
  wins: number;
  losses: number;
  turns: number;
}

export interface SenRevealAnswerView {
  playerId: string;
  value: string;
}

export interface SenRevealRoundView {
  number: number;
  activePlayerId: string;
  phase: SenRevealPhase;
  /** null → show the placeholder ("<nickname> is asking out loud"). */
  question: string | null;
  eligiblePlayerIds: string[];
  answeredPlayerIds: string[];
  /** The viewer's own answer — never anyone else's before the reveal. */
  myAnswer: string | null;
  /** All answers, and only after the reveal. An array, ordered, so the ETag is deterministic. */
  answers: SenRevealAnswerView[] | null;
  winnerId: string | null;
  loserId: string | null;
  startedAt: string;
  revealedAt: string | null;
  resolvedAt: string | null;
  canSetQuestion: boolean;
  canSubmitAnswer: boolean;
  canReveal: boolean;
  canForceReveal: boolean;
  canPickResult: boolean;
  canGoNext: boolean;
}

export interface SenRevealView {
  circle: { number: number };
  /** Non-null → fewer than `minPlayers` are active and `round` is null. */
  pausedReason: 'not-enough-players' | null;
  round: SenRevealRoundView | null;
  /** Active players, in join order. */
  scoreboard: SenRevealScoreView[];
  canSkipRound: boolean;
}

/** Server-side limits, mirrored so the UI can stop the user before the request does. */
export const MAX_QUESTION_LENGTH = 300;
export const DEFAULT_MAX_ANSWER_LENGTH = 200;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;
export const NICKNAME_MAX_LENGTH = 20;
export const PASSWORD_MAX_LENGTH = 64;
