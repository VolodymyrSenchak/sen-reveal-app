/** Mirror of the API's `NumberGuessView` (sen-reveal-api `src/games/number-guess/numberGuess.projection.ts`). */

import { GamePhase, GameViewBase, RoundViewBase, ScoreView } from './game.model';

export type NumberGuessPhase = GamePhase;

export type NumberGuessScoreView = ScoreView;

export interface NumberGuessGuessView {
  playerId: string;
  value: number;
  /** How far off, once the right answer is in. null before that. */
  distance: number | null;
}

export interface NumberGuessRoundView extends RoundViewBase {
  /** The viewer's own guess — never anyone else's before the reveal. */
  myGuess: number | null;
  /** All guesses, and only after the reveal. An array, ordered, so the ETag is deterministic. */
  guesses: NumberGuessGuessView[] | null;
  /** The number everybody was aiming at. Only once the round is resolved. */
  correctAnswer: number | null;
  /** Closest to the answer — several when they tie. */
  winnerIds: string[];
  /** Furthest from the answer. Empty when every guess is equally close. */
  loserIds: string[];
  canSetCorrectAnswer: boolean;
}

export interface NumberGuessView extends GameViewBase<NumberGuessRoundView> {
  round: NumberGuessRoundView | null;
}

/** Server-side bound on a guess and on the right answer, mirrored so the UI can say no first. */
export const GUESS_LIMIT = 1_000_000_000;
