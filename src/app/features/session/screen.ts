import { GameViewBase, SessionView, TerminalReason, WhoAmIRoundView, WhoAmIView } from '../../models';

export type Screen =
  | 'loading'
  | 'lobby'
  | 'ask'
  | 'answer'
  | 'reveal'
  | 'result'
  | 'paused'
  | 'ended'
  // who-am-i: naming your target, then the table of cards (both before and after the reveal)
  | 'name'
  | 'board';

/**
 * The whole of the session shell's routing, as a pure function of the latest snapshot.
 * Kept out of the component so the (status, phase, isAsker, terminal) table can be tested directly.
 */
export function pickScreen(
  view: SessionView<GameViewBase | WhoAmIView> | null,
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
  if (view.gameType === 'who-am-i') {
    // no asker here: whoever still owes a name names, everybody else looks at the cards
    return (round as WhoAmIRoundView).canSubmitName ? 'name' : 'board';
  }
  if (round.phase === 'answering') {
    return isAsker ? 'ask' : 'answer';
  }
  return round.phase === 'revealed' ? 'reveal' : 'result';
}
