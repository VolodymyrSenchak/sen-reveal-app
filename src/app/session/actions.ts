import { GameAction } from '../models';

/** Wire types are namespaced strings. Wrapped once so no component ever types one. */
export const Lobby = {
  start: (): GameAction => ({ type: 'lobby.start', payload: {} }),
  kick: (playerId: string): GameAction => ({ type: 'lobby.kick', payload: { playerId } }),
  transferHost: (playerId: string): GameAction => ({ type: 'lobby.transferHost', payload: { playerId } }),
  leave: (): GameAction => ({ type: 'lobby.leave', payload: {} }),
  end: (): GameAction => ({ type: 'lobby.end', payload: {} }),
} as const;

export const SenReveal = {
  /** An empty `text` resets the question to null — that is how the asker un-types it. */
  setQuestion: (text: string): GameAction => ({ type: 'sen-reveal.setQuestion', payload: { text } }),
  submitAnswer: (value: string): GameAction => ({ type: 'sen-reveal.submitAnswer', payload: { value } }),
  reveal: (force = false): GameAction => ({ type: 'sen-reveal.reveal', payload: { force } }),
  pickResult: (winnerId: string, loserId: string | null): GameAction => ({
    type: 'sen-reveal.pickResult',
    payload: { winnerId, loserId },
  }),
  nextRound: (): GameAction => ({ type: 'sen-reveal.nextRound', payload: {} }),
  skipRound: (): GameAction => ({ type: 'sen-reveal.skipRound', payload: {} }),
} as const;

export const NumberGuess = {
  /** An empty `text` resets the question to null — that is how the asker un-types it. */
  setQuestion: (text: string): GameAction => ({ type: 'number-guess.setQuestion', payload: { text } }),
  submitGuess: (value: number): GameAction => ({ type: 'number-guess.submitGuess', payload: { value } }),
  reveal: (force = false): GameAction => ({ type: 'number-guess.reveal', payload: { force } }),
  /** Entering the right answer is what resolves the round: the game scores it, nobody picks. */
  setCorrectAnswer: (value: number): GameAction => ({ type: 'number-guess.setCorrectAnswer', payload: { value } }),
  nextRound: (): GameAction => ({ type: 'number-guess.nextRound', payload: {} }),
  skipRound: (): GameAction => ({ type: 'number-guess.skipRound', payload: {} }),
} as const;
