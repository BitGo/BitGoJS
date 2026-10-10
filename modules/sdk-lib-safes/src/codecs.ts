/**
 * @prettier
 */
import * as E from 'fp-ts/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

/** Decode with an io-ts codec, throwing on failure. Mirrors sdk-core's utils/codecs.decodeWithCodec. */
export function decodeWithCodec<A>(codec: t.Type<A, unknown, unknown>, input: unknown, label: string): A {
  const result = codec.decode(input);
  if (E.isLeft(result)) {
    const errors = result.left.map((e) => e.message ?? 'unknown').join('; ');
    throw new Error(`${label}: ${errors}`);
  }
  return result.right;
}

/**
 * Validates raw JSON against an io-ts codec plus a closed set of allowed keys.
 *
 * The input must be a plain object whose keys are all members of `knownKeys` (unknown fields
 * are rejected) and must decode successfully against `codec`. The result is a new object whose
 * keys are ordered by `knownKeys` (canonical/deterministic order). Intended for "declared-subset"
 * payloads where the object self-identifies which fields it carries and any absent field is
 * simply omitted. Empty objects are allowed; callers that require at least one field must enforce
 * that themselves.
 */
export function validateJSONAgainstCodec<A extends Record<string, any>, K extends string>(
  raw: unknown,
  codec: t.Type<A, any, unknown>,
  knownKeys: ReadonlyArray<K>,
  label: string
): A {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${label}: expected an object`);
  }

  const record = raw as Record<string, unknown>;
  const knownKeysSet = new Set<string>(knownKeys);
  for (const key of Object.keys(record)) {
    if (!knownKeysSet.has(key)) {
      throw new Error(`${label}: unknown field ${key}`);
    }
  }

  const decoded = codec.decode(record);
  if (E.isLeft(decoded)) {
    throw new Error(`${label}: ${PathReporter.report(decoded).join('; ')}`);
  }

  // Reconstruct in canonical/deterministic order so any direct serialization of the
  // returned object preserves the exact key ordering declared by `knownKeys`.
  const ordered = {} as A;
  const present = decoded.right;
  for (const key of knownKeys) {
    const prop = key as unknown as keyof A;
    if (prop in present) {
      ordered[prop] = present[prop];
    }
  }

  return ordered;
}
