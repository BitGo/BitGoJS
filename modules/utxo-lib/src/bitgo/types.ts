import { TapLeafScript } from 'bip174/src/lib/interfaces';
export { TapLeafScript };

export type Tuple<T> = [T, T];

export function isTuple<T>(arr: T[]): arr is Tuple<T> {
  return arr.length === 2;
}

export type Triple<T> = [T, T, T];

export function isTriple<T>(arr: T[]): arr is Triple<T> {
  return arr.length === 3;
}

/**
 * Checks if the given value is an array of Buffer objects.
 * @param v - The value to check.
 * @returns A boolean indicating whether v is an array of Buffer objects.
 */
export function isBufferArray(v: unknown): v is Buffer[] {
  return Array.isArray(v) && v.every((e) => Buffer.isBuffer(e));
}
