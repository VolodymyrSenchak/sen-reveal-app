import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameAction, SenRevealView, SessionView } from '../../../../../models';
import { SessionStore } from '../../../../../session/session.store';
import { AskView } from './ask.view';

function answering(question: string | null): SessionView<SenRevealView> {
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
        phase: 'answering',
        question,
        eligiblePlayerIds: ['p2', 'p3'],
        answeredPlayerIds: [],
        myAnswer: null,
        answers: [],
        winnerId: null,
        loserId: null,
        startedAt: '2026-01-01T20:05:00.000Z',
        revealedAt: null,
        resolvedAt: null,
        canSetQuestion: true,
        canSubmitAnswer: false,
        canReveal: false,
        canForceReveal: false,
        canPickResult: false,
        canGoNext: false,
      },
    },
  };
}

function mount(question: string | null = null) {
  TestBed.configureTestingModule({ providers: [SessionStore] });
  TestBed.inject(SessionStore).apply(answering(question));

  const fixture = TestBed.createComponent(AskView);
  fixture.componentRef.setInput('banner', 'live');
  fixture.detectChanges();

  const emitted: GameAction[] = [];
  fixture.componentInstance.act.subscribe((action) => emitted.push(action));
  return { emitted, fixture };
}

function type(fixture: ComponentFixture<AskView>, text: string): void {
  const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('#question');
  textarea.value = text;
  textarea.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

const showButton = (fixture: ComponentFixture<AskView>): HTMLButtonElement =>
  Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find((button) =>
    button.textContent?.includes('question'),
  )!;

describe('AskView', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => vi.useRealTimers());

  it('keeps the question to itself while it is being typed', () => {
    vi.useFakeTimers();
    const { fixture, emitted } = mount();

    type(fixture, 'Best useless superpower?');
    vi.advanceTimersByTime(5000);

    expect(emitted).toEqual([]);
  });

  it('keeps the draft when a snapshot arrives mid-sentence', () => {
    const { fixture } = mount();
    type(fixture, 'Best useless');

    TestBed.inject(SessionStore).apply({ ...answering(null), version: 2 });
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('#question');
    expect(textarea.value).toBe('Best useless');
  });

  it('sends the question once, trimmed, on Show question', () => {
    const { fixture, emitted } = mount();

    type(fixture, '  Best useless superpower? ');
    showButton(fixture).click();

    expect(emitted).toEqual([{ type: 'sen-reveal.setQuestion', payload: { text: 'Best useless superpower?' } }]);
  });

  it('has nothing to show until there is a question', () => {
    const { fixture } = mount();
    expect(showButton(fixture).disabled).toBe(true);

    type(fixture, '   ');
    expect(showButton(fixture).disabled).toBe(true);

    type(fixture, 'Best useless superpower?');
    expect(showButton(fixture).disabled).toBe(false);
  });

  it('offers an update only once the shown question has been edited', () => {
    const { fixture } = mount('Best useless superpower?');
    expect(showButton(fixture).textContent).toContain('Update question');
    expect(showButton(fixture).disabled).toBe(true);

    type(fixture, 'Worst useless superpower?');
    expect(showButton(fixture).disabled).toBe(false);
  });

  it('takes a shown question back when the box is emptied', () => {
    const { fixture, emitted } = mount('Best useless superpower?');

    type(fixture, '');
    showButton(fixture).click();

    expect(emitted).toEqual([{ type: 'sen-reveal.setQuestion', payload: { text: '' } }]);
  });
});
