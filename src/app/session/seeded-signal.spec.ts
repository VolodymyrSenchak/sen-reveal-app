import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { seededSignal } from './seeded-signal';

describe('seededSignal', () => {
  const setup = () => {
    const round = signal({ number: 1, question: 'first' });
    const draft = seededSignal(
      () => round().number,
      () => round().question,
    );
    return { round, draft };
  };

  it('starts from the seed', () => {
    expect(setup().draft()).toBe('first');
  });

  it('keeps what was written when a new object arrives with the same key', () => {
    const { round, draft } = setup();
    draft.set('typing');

    round.set({ number: 1, question: 'changed elsewhere' });

    expect(draft()).toBe('typing');
  });

  it('reseeds when the key changes', () => {
    const { round, draft } = setup();
    draft.set('typing');

    round.set({ number: 2, question: 'second' });

    expect(draft()).toBe('second');
  });
});
