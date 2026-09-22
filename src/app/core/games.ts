import { GameType } from '../models';

/** The catalogue behind the pick screen, the create screen, the lobby and the join lookup. */
export interface GameInfo {
  type: GameType;
  title: string;
  /** What the players type in — the one line that separates the games. */
  inputLabel: string;
  lede: string;
}

export const GAMES: readonly GameInfo[] = [
  {
    type: 'sen-reveal',
    title: 'Phrase Expose',
    inputLabel: 'Text answers',
    lede: 'The asker asks anything. Everyone writes a free-text answer in secret, then all of them flip over at once.',
  },
  {
    type: 'number-guess',
    title: 'Number Guessing',
    inputLabel: 'Numbers only',
    lede: 'Everyone picks a number, the asker enters the true one. Closest and furthest are scored automatically.',
  },
];

export function gameInfo(type: GameType | null | undefined): GameInfo | null {
  return GAMES.find((game) => game.type === type) ?? null;
}

/** Falls back to the raw type, so an unknown game still names itself rather than going blank. */
export function gameTitle(type: GameType | null | undefined): string {
  return gameInfo(type)?.title ?? (type ?? '');
}
