import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameAction, NumberGuessGuessView, NumberGuessView, SessionView } from '../../../../models';
import { SessionStore } from '../../../../session/session.store';
import { NumberGuessRevealView } from './reveal.view';

function revealed(guesses: NumberGuessGuessView[]): SessionView<NumberGuessView> {
  return {
    code: '042137',
    gameType: 'number-guess',
    status: 'in_progress',
    version: 1,
    createdAt: '2026-01-01T20:00:00.000Z',
    expiresAt: '2026-01-02T20:00:00.000Z',
    hostPlayerId: 'p1',
    me: { playerId: 'p1', nickname: 'Vova', isHost: true },
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
        phase: 'revealed',
        question: 'How many bones in a human body?',
        eligiblePlayerIds: guesses.map((guess) => guess.playerId),
        answeredPlayerIds: guesses.map((guess) => guess.playerId),
        myGuess: null,
        guesses,
        correctAnswer: null,
        winnerIds: [],
        loserIds: [],
        startedAt: '2026-01-01T20:05:00.000Z',
        revealedAt: '2026-01-01T20:07:00.000Z',
        resolvedAt: null,
        canSetQuestion: false,
        canSubmitAnswer: false,
        canReveal: false,
        canForceReveal: false,
        canSetCorrectAnswer: true,
        canGoNext: false,
      },
    },
  };
}

/** Reaches the component's protected members the way the template does. */
type Internals = {
  draft: { (): string; set(value: string): void };
  error(): string | null;
  canConfirm(): boolean;
  guesses(): NumberGuessGuessView[];
  confirm(): void;
};

function mount(guesses: NumberGuessGuessView[]) {
  TestBed.configureTestingModule({ providers: [SessionStore] });
  const store = TestBed.inject(SessionStore);
  store.apply(revealed(guesses));

  const fixture = TestBed.createComponent(NumberGuessRevealView);
  fixture.componentRef.setInput('banner', 'live');
  fixture.detectChanges();

  const emitted: GameAction[] = [];
  fixture.componentInstance.act.subscribe((action) => emitted.push(action));
  return { view: fixture.componentInstance as unknown as Internals, emitted, fixture };
}

const guess = (playerId: string, value: number): NumberGuessGuessView => ({ playerId, value, distance: null });

describe('NumberGuessRevealView', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('shows the numbers low to high, whatever order they came in', () => {
    const { view } = mount([guess('p2', 300), guess('p3', 12)]);
    expect(view.guesses().map((item) => item.value)).toEqual([12, 300]);
  });

  it('will not confirm until the answer is a number', () => {
    const { view } = mount([guess('p2', 300), guess('p3', 12)]);
    expect(view.canConfirm()).toBe(false);

    view.draft.set('two hundred');
    expect(view.canConfirm()).toBe(false);
    expect(view.error()).toBeTruthy();

    view.draft.set('206');
    expect(view.canConfirm()).toBe(true);
    expect(view.error()).toBeNull();
  });

  it('stays quiet while the box is still empty', () => {
    const { view } = mount([guess('p2', 300)]);
    expect(view.error()).toBeNull();
  });

  it('sends the answer as a number, and nobody as a pick', () => {
    const { view, emitted } = mount([guess('p2', 300), guess('p3', 12)]);
    view.draft.set('206');
    view.confirm();

    expect(emitted).toEqual([{ type: 'number-guess.setCorrectAnswer', payload: { value: 206 } }]);
  });

  it('sends nothing when the answer is not a number', () => {
    const { view, emitted } = mount([guess('p2', 300)]);
    view.draft.set('lots');
    view.confirm();

    expect(emitted).toEqual([]);
  });
});
