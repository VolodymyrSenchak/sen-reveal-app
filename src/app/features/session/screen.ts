import { GameViewBase, SessionView, TerminalReason } from '../../models';

export type Screen = 'loading' | 'lobby' | 'ask' | 'answer' | 'reveal' | 'result' | 'paused' | 'ended';

/**
 * The whole of the session shell's routing, as a pure function of the latest snapshot.
 * Kept out of the component so the (status, phase, isAsker, terminal) table can be tested directly.
 */
export function pickScreen(
  view: SessionView<GameViewBase> | null,
  terminal: TerminalReason | null,
  isAsker: boolean,
): Screen {
  if (terminal) {
    return 'ended';
  }
  if (!view) {
    return 'loading';
  }
  if (view.status === 'pending') {
    return 'lobby';
  }
  if (view.status === 'finished') {
    return 'ended';
  }
  const round = view.game?.round ?? null;
  if (!round) {
    // fewer than minPlayers are active mid-game; the server paused the circle for us
    return 'paused';
  }
  if (round.phase === 'answering') {
    return isAsker ? 'ask' : 'answer';
  }
  return round.phase === 'revealed' ? 'reveal' : 'result';
}
