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
