import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { NumberGuessView, SessionView } from '../../../../../models';
import { SessionStore } from '../../../../../session/session.store';
import { NumberGuessGuessView } from './guess.view';

function answering(version: number): SessionView<NumberGuessView> {
  return {
    code: '042137',
    gameType: 'number-guess',
    status: 'in_progress',
    version,
    createdAt: '2026-01-01T20:00:00.000Z',
    expiresAt: '2026-01-02T20:00:00.000Z',
    hostPlayerId: 'p1',
    me: { playerId: 'p2', nickname: 'Katya', isHost: false },
    players: [
      { id: 'p1', nickname: 'Vova', isHost: true, isOnline: true, joinedAt: '2026-01-01T20:00:00.000Z' },
      { id: 'p2', nickname: 'Katya', isHost: false, isOnline: true, joinedAt: '2026-01-01T20:01:00.000Z' },
      { id: 'p3', nickname: 'Marta', isHost: false, isOnline: true, joinedAt: '2026-01-01T20:02:00.000Z' },
    ],
    settings: { maxPlayers: 20, allowJoinInProgress: true },
    poll: { intervalMs: 1500 },
    game: {
      circle: { number: 1 },
      pausedReason: null,
      scoreboard: [],
      canSkipRound: false,
      round: {
        number: 3,
        activePlayerId: 'p1',
        phase: 'answering',
        question: null,
        eligiblePlayerIds: ['p2', 'p3'],
        answeredPlayerIds: [],
        myGuess: null,
        guesses: [],
        correctAnswer: null,
        winnerIds: [],
        loserIds: [],
        startedAt: '2026-01-01T20:05:00.000Z',
        revealedAt: null,
        resolvedAt: null,
        canSetQuestion: false,
        canSubmitAnswer: true,
        canReveal: false,
        canForceReveal: false,
        canSetCorrectAnswer: false,
        canGoNext: false,
      },
    },
  };
}

/** Reaches the component's protected members the way the template does. */
type Internals = {
  draft: { (): string; set(value: string): void };
};

describe('NumberGuessGuessView', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('keeps the draft when a snapshot arrives mid-number', () => {
    TestBed.configureTestingModule({ providers: [SessionStore] });
    const store = TestBed.inject(SessionStore);
    store.apply(answering(1));

    const fixture = TestBed.createComponent(NumberGuessGuessView);
    fixture.componentRef.setInput('banner', 'live');
    fixture.detectChanges();
    const view = fixture.componentInstance as unknown as Internals;

    view.draft.set('20');
    store.apply(answering(2));
    fixture.detectChanges();

    expect(view.draft()).toBe('20');
  });
});
