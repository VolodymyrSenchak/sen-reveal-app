import { describe, expect, it } from 'vitest';
import { SenRevealPhase, SenRevealView, SessionStatus, SessionView, TerminalReason } from '../../models';
import { pickScreen, Screen } from './screen';

function session(status: SessionStatus, phase: SenRevealPhase | null): SessionView<SenRevealView> {
  return {
    code: '042137',
    gameType: 'sen-reveal',
    status,
    version: 1,
    createdAt: '2026-01-01T20:00:00.000Z',
    expiresAt: '2026-01-02T20:00:00.000Z',
    hostPlayerId: 'p1',
    me: { playerId: 'p1', nickname: 'Vova', isHost: true },
    players: [],
    settings: { maxPlayers: 20, allowJoinInProgress: true },
    poll: { intervalMs: 1500 },
    game:
      status === 'pending'
        ? null
        : {
            circle: { number: 1 },
            pausedReason: phase === null ? 'not-enough-players' : null,
            scoreboard: [],
            canSkipRound: false,
            round:
              phase === null
                ? null
                : {
                    number: 1,
                    activePlayerId: 'p1',
                    phase,
                    question: null,
                    eligiblePlayerIds: [],
                    answeredPlayerIds: [],
                    myAnswer: null,
                    answers: null,
                    winnerId: null,
                    loserId: null,
                    startedAt: '2026-01-01T20:05:00.000Z',
                    revealedAt: null,
                    resolvedAt: null,
                    canSetQuestion: false,
                    canSubmitAnswer: false,
                    canReveal: false,
                    canForceReveal: false,
                    canPickResult: false,
                    canGoNext: false,
                  },
          },
  };
}

type Row = [SessionStatus | 'none', SenRevealPhase | null, boolean, TerminalReason | null, Screen];

const table: Row[] = [
  ['none', null, false, null, 'loading'],
  ['pending', null, false, null, 'lobby'],
  ['in_progress', 'answering', true, null, 'ask'],
  ['in_progress', 'answering', false, null, 'answer'],
  ['in_progress', 'revealed', true, null, 'reveal'],
  ['in_progress', 'revealed', false, null, 'reveal'],
  ['in_progress', 'resolved', true, null, 'result'],
  ['in_progress', 'resolved', false, null, 'result'],
  // round === null mid-game: fewer than minPlayers are left
  ['in_progress', null, false, null, 'paused'],
  ['finished', null, false, null, 'ended'],
  // terminal beats everything, including a perfectly good round
  ['in_progress', 'answering', true, 'kicked', 'ended'],
  ['pending', null, false, 'expired', 'ended'],
];

describe('pickScreen', () => {
  for (const [status, phase, isAsker, terminal, expected] of table) {
    it(`${status} / ${phase ?? 'no round'} / ${isAsker ? 'asker' : 'answerer'} / ${terminal ?? 'live'} → ${expected}`, () => {
      const view = status === 'none' ? null : session(status, phase);
      expect(pickScreen(view, terminal, isAsker)).toBe(expected);
    });
  }
});
