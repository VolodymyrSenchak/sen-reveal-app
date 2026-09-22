import { GUESS_LIMIT } from '../../../../models';

export interface ParsedGuess {
  /** null when the text is not a number this game accepts. */
  value: number | null;
  error: string | null;
}

/**
 * The one place a typed string turns into a number. `<input type="number">` hands back '' for
 * anything the browser itself could not parse, so an empty box and "12abc" look the same here —
 * both are simply "not a number yet".
 */
export function parseGuess(text: string): ParsedGuess {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) {
    return { value: null, error: 'Enter a number.' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { value: null, error: 'Numbers only — no words.' };
  }
  if (Math.abs(value) > GUESS_LIMIT) {
    return { value: null, error: `Keep it between ${formatNumber(-GUESS_LIMIT)} and ${formatNumber(GUESS_LIMIT)}.` };
  }
  return { value, error: null };
}

/** Grouped digits, and never the 17 decimals a float subtraction can produce. */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
}
