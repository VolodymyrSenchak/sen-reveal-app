import { computed, linkedSignal, untracked, WritableSignal } from '@angular/core';

/**
 * Local state that goes back to `seed()` only when `key()` changes to a new value.
 *
 * Use this, not a bare `linkedSignal`, for anything a player types or picks. `linkedSignal` reruns
 * its computation whenever a signal behind `source` changes, even if `source` returns the same
 * value, and every snapshot replaces the round object, so each one would wipe the input.
 */
export function seededSignal<K, T>(key: () => K, seed: () => T): WritableSignal<T> {
  return linkedSignal<K, T>({ source: computed(key), computation: () => untracked(seed) });
}
