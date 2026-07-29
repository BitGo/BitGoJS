import * as E from 'fp-ts/Either';
import * as t from 'io-ts';

/** io-ts codec for an integer within [min, max]. Rejects non-numbers, floats, and out-of-range values. */
export const boundedInt = (min: number, max: number, label: string) =>
  new t.Type<number, number, unknown>(
    label,
    (u): u is number => typeof u === 'number' && Number.isInteger(u) && u >= min && u <= max,
    (u, c) =>
      typeof u === 'number' && Number.isInteger(u) && u >= min && u <= max
        ? t.success(u)
        : t.failure(u, c, `${label}: expected integer in [${min}, ${max}], got ${JSON.stringify(u)}`),
    t.identity
  );

/** io-ts codec for a non-empty string (intended for base64-encoded binary fields). */
export const base64String = new t.Type<string, string, unknown>(
  'Base64String',
  (u): u is string => typeof u === 'string' && u.length > 0,
  (u, c) =>
    typeof u === 'string' && u.length > 0 ? t.success(u) : t.failure(u, c, 'expected non-empty base64 string'),
  t.identity
);

/**
 * Decode unknown input with an io-ts codec. Returns the decoded value or throws
 * with a descriptive error message. Use when callers should not depend on fp-ts/io-ts directly.
 */
export function decodeWithCodec<A>(codec: t.Type<A, unknown, unknown>, input: unknown, label: string): A {
  const result = codec.decode(input);
  if (E.isLeft(result)) {
    const errors = result.left.map((e) => e.message ?? 'unknown').join('; ');
    throw new Error(`${label}: ${errors}`);
  }
  return result.right;
}
