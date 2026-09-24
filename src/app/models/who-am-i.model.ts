/** Mirror of the API's `WhoAmIView` (sen-reveal-api `src/games/who-am-i/whoAmI.projection.ts`). */

/** `playing`: names go in and everybody sees every card but their own. `revealed`: the host flipped them all. */
export type WhoAmIPhase = 'playing' | 'revealed';

export interface WhoAmICardView {
  playerId: string;
  /** null → nobody has named them yet, or it is the viewer's own card before the reveal. */
  name: string | null;
  /** Who wrote it. null whenever `name` is. */
  givenById: string | null;
  /** The viewer's own card, face down until the reveal. */
  isMine: boolean;
}

export interface WhoAmIRoundView {
  number: number;
  phase: WhoAmIPhase;
  /** Dealt in this round, in join order. */
  playerIds: string[];
  /** Players who have somebody to name. */
  eligiblePlayerIds: string[];
  /** Of those, the ones who already have. */
  answeredPlayerIds: string[];
  /** false → joined mid-round; watching until the next one. */
  isPlaying: boolean;
  /** Whom the viewer names. null for a spectator, or when the chain broke around a leaver. */
  myTargetId: string | null;
  /** The name the viewer gave. null until they have. */
  myGivenName: string | null;
  /** One card per dealt player. null until the viewer has given their own name. */
  cards: WhoAmICardView[] | null;
  startedAt: string;
  revealedAt: string | null;
  canSubmitName: boolean;
  canReveal: boolean;
  canStartNextRound: boolean;
}

export interface WhoAmIView {
  round: WhoAmIRoundView;
}

/** Server-side bound on a name, mirrored so the UI can say no first. */
export const MAX_NAME_LENGTH = 60;
