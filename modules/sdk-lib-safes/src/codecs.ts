/**
 * @prettier
 */
import * as E from 'fp-ts/Either';
import * as t from 'io-ts';

/** Decode with an io-ts codec, throwing on failure. Mirrors sdk-core's utils/codecs.decodeWithCodec. */
export function decodeWithCodec<A>(codec: t.Type<A, unknown, unknown>, input: unknown, label: string): A {
  const result = codec.decode(input);
  if (E.isLeft(result)) {
    const errors = result.left.map((e) => e.message ?? 'unknown').join('; ');
    throw new Error(`${label}: ${errors}`);
  }
  return result.right;
}
