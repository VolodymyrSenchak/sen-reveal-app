/** Mirror of the API's `SenRevealView` (sen-reveal-api `src/games/sen-reveal/senReveal.projection.ts`). */

import { GamePhase, GameViewBase, RoundViewBase, ScoreView } from './game.model';

export type SenRevealPhase = GamePhase;

export type SenRevealScoreView = ScoreView;

export interface SenRevealAnswerView {
  playerId: string;
  value: string;
}

export interface SenRevealRoundView extends RoundViewBase {
  /** The viewer's own answer — never anyone else's before the reveal. */
  myAnswer: string | null;
  /** All answers, and only after the reveal. An array, ordered, so the ETag is deterministic. */
  answers: SenRevealAnswerView[] | null;
  /** While `revealed`: the asker's picks so far. */
  winnerId: string | null;
  loserId: string | null;
  /** The next `setPicks` must carry a higher `seq` than this. */
  picksSeq: number;
  /** Blind picks: no names on the answers. The ids stay available; only the UI hides them. */
  namesHidden: boolean;
  /** Blind picks: the names are out, so the picks can no longer change. */
  picksLocked: boolean;
  canSetPicks: boolean;
  canShowNames: boolean;
  canPickResult: boolean;
}

export interface SenRevealView extends GameViewBase<SenRevealRoundView> {
  round: SenRevealRoundView | null;
}

/** Server-side limit, mirrored so the UI can stop the user before the request does. */
export const DEFAULT_MAX_ANSWER_LENGTH = 200;
