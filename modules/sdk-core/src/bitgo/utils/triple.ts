export type Triple<T> = [T, T, T];

export function isTriple<T>(arr: T[]): arr is Triple<T> {
  return arr.length === 3;
}
