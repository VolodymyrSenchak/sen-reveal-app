import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameAction, SenRevealAnswerView, SenRevealRoundView, SenRevealView, SessionView } from '../../../../../models';
import { SessionStore } from '../../../../../session/session.store';
import { RevealView } from './reveal.view';

function revealed(answers: SenRevealAnswerView[], roundChanges: Partial<SenRevealRoundView> = {}): SessionView<SenRevealView> {
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
        picksSeq: 0,
        namesHidden: false,
        picksLocked: false,
        startedAt: '2026-01-01T20:05:00.000Z',
        revealedAt: '2026-01-01T20:07:00.000Z',
        resolvedAt: null,
        canSetQuestion: false,
        canSubmitAnswer: false,
        canReveal: false,
        canForceReveal: false,
        canSetPicks: true,
        canShowNames: false,
        canPickResult: true,
        canGoNext: false,
        ...roundChanges,
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
  showNames(): void;
  confirm(): void;
};

function mount(answers: SenRevealAnswerView[], roundChanges: Partial<SenRevealRoundView> = {}) {
  TestBed.configureTestingModule({ providers: [SessionStore] });
  const store = TestBed.inject(SessionStore);
  store.apply(revealed(answers, roundChanges));

  const fixture = TestBed.createComponent(RevealView);
  fixture.componentRef.setInput('banner', 'live');
  fixture.detectChanges();

  const emitted: GameAction[] = [];
  fixture.componentInstance.act.subscribe((action) => emitted.push(action));
  return { view: fixture.componentInstance as unknown as Internals, emitted, fixture, store };
}

const pickResultOnly = (emitted: GameAction[]) => emitted.filter((action) => action.type === 'sen-reveal.pickResult');

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
    expect(pickResultOnly(emitted)).toEqual([
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

    expect(pickResultOnly(emitted)).toEqual([
      { type: 'sen-reveal.pickResult', payload: { winnerId: 'p2', loserId: 'p3' } },
    ]);
  });

  it('sends every change of the picks to the server as it happens', () => {
    const { view, emitted } = mount([
      { playerId: 'p2', value: 'avocado radar' },
      { playerId: 'p3', value: 'rewind a song' },
    ]);

    view.pickBest('p2');
    view.pickWorst('p3');
    view.pickWorst('p2');

    expect(emitted).toEqual([
      { type: 'sen-reveal.setPicks', payload: { winnerId: 'p2', loserId: null, seq: 1 } },
      { type: 'sen-reveal.setPicks', payload: { winnerId: 'p2', loserId: 'p3', seq: 2 } },
      { type: 'sen-reveal.setPicks', payload: { winnerId: null, loserId: 'p2', seq: 3 } },
    ]);
  });

  it('numbers its taps after the ones the server already has', () => {
    const { view, emitted } = mount(
      [
        { playerId: 'p2', value: 'avocado radar' },
        { playerId: 'p3', value: 'rewind a song' },
      ],
      { picksSeq: 7 },
    );

    view.pickBest('p2');

    expect(emitted).toEqual([{ type: 'sen-reveal.setPicks', payload: { winnerId: 'p2', loserId: null, seq: 8 } }]);
  });

  it('keeps the asker’s own taps when a snapshot arrives', () => {
    const answers = [
      { playerId: 'p2', value: 'avocado radar' },
      { playerId: 'p3', value: 'rewind a song' },
    ];
    const { view, store } = mount(answers);

    view.pickBest('p2');
    view.pickWorst('p3');
    store.apply({ ...revealed(answers, { winnerId: 'p2' }), version: 2 });

    expect(view.winnerId()).toBe('p2');
    expect(view.loserId()).toBe('p3');
  });

  it('restores the asker’s picks from the server after a reload', () => {
    const { view } = mount(
      [
        { playerId: 'p2', value: 'avocado radar' },
        { playerId: 'p3', value: 'rewind a song' },
      ],
      { winnerId: 'p3', loserId: 'p2' },
    );

    expect(view.winnerId()).toBe('p3');
    expect(view.loserId()).toBe('p2');
  });
});

describe('RevealView for everyone else', () => {
  beforeEach(() => TestBed.resetTestingModule());

  const spectator = { canSetPicks: false, canPickResult: false };
  const answers = [
    { playerId: 'p2', value: 'avocado radar' },
    { playerId: 'p3', value: 'rewind a song' },
  ];

  it('shows the picks live, with no buttons to press', () => {
    const { view, store, fixture } = mount(answers, spectator);
    expect(fixture.nativeElement.querySelector('.pickTag')).toBeNull();

    store.apply({ ...revealed(answers, { ...spectator, winnerId: 'p2', loserId: 'p3' }), version: 2 });
    fixture.detectChanges();

    expect(view.winnerId()).toBe('p2');
    expect(view.loserId()).toBe('p3');
    expect(fixture.nativeElement.querySelector('.pickTag--best')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.pickTag--worst')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button.pick')).toBeNull();
  });
});

describe('RevealView with blind picks', () => {
  beforeEach(() => TestBed.resetTestingModule());

  const answers = [
    { playerId: 'p2', value: 'avocado radar' },
    { playerId: 'p3', value: 'rewind a song' },
  ];
  const blind = { namesHidden: true, canShowNames: true, canPickResult: false };
  const buttonLabels = (fixture: { nativeElement: HTMLElement }) =>
    [...fixture.nativeElement.querySelectorAll('button.btn')].map((button) => button.textContent?.trim());

  it('numbers the cards and leaves the names out', () => {
    const { fixture } = mount(answers, blind);
    const cards = [...fixture.nativeElement.querySelectorAll('.answerCard__name')] as HTMLElement[];

    expect(cards.map((card) => card.textContent)).toEqual(['Answer 1', 'Answer 2']);
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Katya');
    expect(text).not.toContain('Marta');
  });

  it('hides the names from the other players as well', () => {
    const { fixture } = mount(answers, { namesHidden: true, canSetPicks: false, canPickResult: false });

    expect(fixture.nativeElement.textContent).not.toContain('Katya');
    expect(buttonLabels(fixture)).toEqual([]);
  });

  it('offers the names instead of the confirm, once both picks are in', () => {
    const { view, emitted, fixture } = mount(answers, blind);
    expect(buttonLabels(fixture)).toEqual(['Show who wrote what']);

    view.showNames();
    expect(emitted).toEqual([]);

    view.pickBest('p2');
    view.pickWorst('p3');
    fixture.detectChanges();
    view.showNames();

    expect(emitted.at(-1)).toEqual({ type: 'sen-reveal.showNames', payload: {} });
  });

  it('puts the names on the locked cards and brings the confirm back', () => {
    const { view, emitted, fixture } = mount(answers, {
      winnerId: 'p2',
      loserId: 'p3',
      picksLocked: true,
      canSetPicks: false,
    });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Your picks are locked in.');
    expect(text).toContain('Katya');
    expect(text).toContain('Marta');
    expect(fixture.nativeElement.querySelector('button.pick')).toBeNull();
    expect(buttonLabels(fixture)).toEqual(['Confirm the picks']);

    view.confirm();
    expect(emitted).toEqual([{ type: 'sen-reveal.pickResult', payload: { winnerId: 'p2', loserId: 'p3' } }]);
  });

  it('stops telling the other players that the asker is still picking', () => {
    const { fixture } = mount(answers, { picksLocked: true, canSetPicks: false, canPickResult: false });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Vova's picks are locked in.");
    expect(text).not.toContain('is picking');
  });
});
