import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameAction, NumberGuessView, SessionView } from '../../../../../models';
import { SessionStore } from '../../../../../session/session.store';
import { NumberGuessAskView } from './ask.view';

function answering(): SessionView<NumberGuessView> {
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
        canSetQuestion: true,
        canSubmitAnswer: false,
        canReveal: false,
        canForceReveal: false,
        canSetCorrectAnswer: false,
        canGoNext: false,
      },
    },
  };
}

function mount() {
  TestBed.configureTestingModule({ providers: [SessionStore] });
  TestBed.inject(SessionStore).apply(answering());

  const fixture = TestBed.createComponent(NumberGuessAskView);
  fixture.componentRef.setInput('banner', 'live');
  fixture.detectChanges();

  const emitted: GameAction[] = [];
  fixture.componentInstance.act.subscribe((action) => emitted.push(action));
  return { emitted, fixture };
}

function type(fixture: ComponentFixture<NumberGuessAskView>, text: string): void {
  const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('#question');
  textarea.value = text;
  textarea.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

const showButton = (fixture: ComponentFixture<NumberGuessAskView>): HTMLButtonElement =>
  Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find((button) =>
    button.textContent?.includes('question'),
  )!;

describe('NumberGuessAskView', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => vi.useRealTimers());

  it('keeps the question to itself while it is being typed', () => {
    vi.useFakeTimers();
    const { fixture, emitted } = mount();

    type(fixture, 'How many bones in a human body?');
    vi.advanceTimersByTime(5000);

    expect(emitted).toEqual([]);
  });

  it('keeps the draft when a snapshot arrives mid-sentence', () => {
    const { fixture } = mount();
    type(fixture, 'How many');

    TestBed.inject(SessionStore).apply({ ...answering(), version: 2 });
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('#question');
    expect(textarea.value).toBe('How many');
  });

  it('sends the question once, trimmed, on Show question', () => {
    const { fixture, emitted } = mount();

    type(fixture, '  How many bones in a human body? ');
    showButton(fixture).click();

    expect(emitted).toEqual([
      { type: 'number-guess.setQuestion', payload: { text: 'How many bones in a human body?' } },
    ]);
  });
});
