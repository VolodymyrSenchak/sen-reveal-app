import { describe, expect, it } from 'vitest';
import { GUESS_LIMIT } from '../../../../models';
import { formatNumber, parseGuess } from './number-input';

describe('parseGuess', () => {
  it('takes whole numbers, decimals and negatives', () => {
    expect(parseGuess('42')).toEqual({ value: 42, error: null });
    expect(parseGuess(' 3.5 ')).toEqual({ value: 3.5, error: null });
    expect(parseGuess('-17')).toEqual({ value: -17, error: null });
    expect(parseGuess('0')).toEqual({ value: 0, error: null });
  });

  it('takes a comma as the decimal point, because half the table types it that way', () => {
    expect(parseGuess('3,5')).toEqual({ value: 3.5, error: null });
  });

  it('refuses anything that is not a number', () => {
    expect(parseGuess('').value).toBeNull();
    expect(parseGuess('   ').value).toBeNull();
    expect(parseGuess('twelve').value).toBeNull();
    expect(parseGuess('12abc').value).toBeNull();
    expect(parseGuess('Infinity').value).toBeNull();
  });

  it('refuses numbers the server would refuse too', () => {
    expect(parseGuess(String(GUESS_LIMIT)).value).toBe(GUESS_LIMIT);
    expect(parseGuess(String(-GUESS_LIMIT)).value).toBe(-GUESS_LIMIT);
    expect(parseGuess(String(GUESS_LIMIT + 1)).value).toBeNull();
    expect(parseGuess(String(GUESS_LIMIT + 1)).error).toContain('Keep it between');
  });

  it('always explains itself when it says no', () => {
    for (const text of ['', 'twelve', String(GUESS_LIMIT * 2)]) {
      expect(parseGuess(text).error).toBeTruthy();
    }
  });
});

describe('formatNumber', () => {
  it('groups digits and hides float noise', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(3.5)).toBe('3.5');
    expect(formatNumber(0.30000000000000004)).toBe('0.3');
    expect(formatNumber(-42)).toBe('-42');
  });
});
