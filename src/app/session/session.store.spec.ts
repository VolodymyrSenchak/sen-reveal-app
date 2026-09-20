import { describe, expect, it } from 'vitest';
import { SenRevealView, SessionView } from '../models';
import { SessionStore } from './session.store';

function view(overrides: Partial<SessionView<SenRevealView>> = {}): SessionView<SenRevealView> {
  return {
    code: '042137',
    gameType: 'sen-reveal',
    status: 'in_progress',
    version: 5,
    createdAt: '2026-01-01T20:00:00.000Z',
    expiresAt: '2026-01-02T20:00:00.000Z',
    hostPlayerId: 'p1',
    me: { playerId: 'p1', nickname: 'Vova', isHost: true },
    players: [
      { id: 'p1', nickname: 'Vova', isHost: true, isOnline: true, joinedAt: '2026-01-01T20:00:00.000Z' },
      { id: 'p2', nickname: 'Katya', isHost: false, isOnline: true, joinedAt: '2026-01-01T20:01:00.000Z' },
    ],
    settings: { maxPlayers: 20, allowJoinInProgress: true, minPlayers: 3, maxAnswerLength: 200 },
    poll: { intervalMs: 1500 },
    game: null,
    ...overrides,
  };
}

describe('SessionStore', () => {
  it('drops a snapshot from an older version', () => {
    const store = new SessionStore();
    store.apply(view({ version: 5 }));
    store.apply(view({ version: 4, code: 'stale' }));

    expect(store.view()?.version).toBe(5);
    expect(store.code()).toBe('042137');
  });

  it('applies a snapshot at the same version, because presence does not bump it', () => {
    const store = new SessionStore();
    store.apply(view({ version: 5 }));

    const offline = view({ version: 5 });
    offline.players[1] = { ...offline.players[1], isOnline: false };
    store.apply(offline);

    expect(store.players()[1].isOnline).toBe(false);
  });

  it('replaces rather than merges, so fields the server dropped go away', () => {
    const store = new SessionStore();
    store.apply(view({ version: 5, game: gameWith({ answers: [{ playerId: 'p2', value: 'hi' }] }) }));
    store.apply(view({ version: 6, game: gameWith({ answers: null }) }));

    expect(store.round()?.answers).toBeNull();
  });

  it('falls back to "(left)" for a player who is gone from the roster', () => {
    const store = new SessionStore();
    store.apply(view());

    expect(store.nicknameOf()('p2')).toBe('Katya');
    expect(store.nicknameOf()('p9')).toBe('(left)');
    expect(store.nicknameOf()(null)).toBe('');
  });

  it('knows the viewer is the asker without re-deriving any rule', () => {
    const store = new SessionStore();
    store.apply(view({ game: gameWith({ activePlayerId: 'p1' }) }));
    expect(store.isAsker()).toBe(true);

    store.apply(view({ version: 7, game: gameWith({ activePlayerId: 'p2' }) }));
    expect(store.isAsker()).toBe(false);
  });
});

function gameWith(round: Partial<NonNullable<SenRevealView['round']>>): SenRevealView {
  return {
    circle: { number: 1 },
    pausedReason: null,
    scoreboard: [],
    canSkipRound: false,
    round: {
      number: 3,
      activePlayerId: 'p1',
      phase: 'revealed',
      question: 'Best useless superpower?',
      eligiblePlayerIds: ['p2'],
      answeredPlayerIds: ['p2'],
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
      ...round,
    },
  };
}
