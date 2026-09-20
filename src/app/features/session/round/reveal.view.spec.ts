import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameAction, SenRevealAnswerView, SenRevealView, SessionView } from '../../../models';
import { SessionStore } from '../../../session/session.store';
import { RevealView } from './reveal.view';

function revealed(answers: SenRevealAnswerView[]): SessionView<SenRevealView> {
  return {
    code: '042137',
    gameType: 'sen-reveal',
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
        question: 'Best useless superpower?',
        eligiblePlayerIds: answers.map((answer) => answer.playerId),
        answeredPlayerIds: answers.map((answer) => answer.playerId),
        myAnswer: null,
        answers,
        winnerId: null,
        loserId: null,
        startedAt: '2026-01-01T20:05:00.000Z',
        revealedAt: '2026-01-01T20:07:00.000Z',
        resolvedAt: null,
        canSetQuestion: false,
        canSubmitAnswer: false,
        canReveal: false,
        canForceReveal: false,
        canPickResult: true,
        canGoNext: false,
      },
    },
  };
}

/** Reaches the component's protected members the way the template does. */
type Internals = {
  winnerId: { (): string | null; set(value: string | null): void };
  loserId: { (): string | null; set(value: string | null): void };
  canConfirm(): boolean;
  pickBest(playerId: string): void;
  pickWorst(playerId: string): void;
  confirm(): void;
};

function mount(answers: SenRevealAnswerView[]) {
  TestBed.configureTestingModule({ providers: [SessionStore] });
  const store = TestBed.inject(SessionStore);
  store.apply(revealed(answers));

  const fixture = TestBed.createComponent(RevealView);
  fixture.componentRef.setInput('banner', 'live');
  fixture.detectChanges();

  const emitted: GameAction[] = [];
  fixture.componentInstance.act.subscribe((action) => emitted.push(action));
  return { view: fixture.componentInstance as unknown as Internals, emitted, fixture };
}

describe('RevealView picking', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('needs a best and a worst before it will confirm', () => {
    const { view } = mount([
      { playerId: 'p2', value: 'avocado radar' },
      { playerId: 'p3', value: 'rewind a song' },
    ]);

    expect(view.canConfirm()).toBe(false);
    view.pickBest('p2');
    expect(view.canConfirm()).toBe(false);
    view.pickWorst('p3');
    expect(view.canConfirm()).toBe(true);
  });

  it('will not let the same player be both', () => {
    const { view } = mount([
      { playerId: 'p2', value: 'avocado radar' },
      { playerId: 'p3', value: 'rewind a song' },
    ]);

    view.pickBest('p2');
    view.pickWorst('p2');

    expect(view.loserId()).toBe('p2');
    expect(view.winnerId()).toBeNull();
    expect(view.canConfirm()).toBe(false);
  });

  it('tapping the same button again clears it', () => {
    const { view } = mount([
      { playerId: 'p2', value: 'avocado radar' },
      { playerId: 'p3', value: 'rewind a song' },
    ]);

    view.pickBest('p2');
    view.pickBest('p2');

    expect(view.winnerId()).toBeNull();
  });

  it('allows a null loser when only one player answered', () => {
    const { view, emitted } = mount([{ playerId: 'p2', value: 'avocado radar' }]);

    view.pickBest('p2');
    expect(view.canConfirm()).toBe(true);

    view.confirm();
    expect(emitted).toEqual([
      { type: 'sen-reveal.pickResult', payload: { winnerId: 'p2', loserId: null } },
    ]);
  });

  it('sends both ids when more than one answered', () => {
    const { view, emitted } = mount([
      { playerId: 'p2', value: 'avocado radar' },
      { playerId: 'p3', value: 'rewind a song' },
    ]);

    view.pickBest('p2');
    view.pickWorst('p3');
    view.confirm();

    expect(emitted).toEqual([
      { type: 'sen-reveal.pickResult', payload: { winnerId: 'p2', loserId: 'p3' } },
    ]);
  });
});
