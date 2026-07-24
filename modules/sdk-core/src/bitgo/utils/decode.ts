import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as Json from 'fp-ts/Json';
import * as O from 'fp-ts/Option';
import * as NEA from 'fp-ts/ReadonlyNonEmptyArray';
import * as t from 'io-ts';

/**
 * Format an `Errors` object as a human-readable `string`. See `decode` in `decode.ts` for an example.
 * Inspired by
 * https://github.com/mmkal/ts/blob/94a9ba8f2931c9c91122d00b0bf1bd21b2be05cd/packages/io-ts-extra/src/reporters.ts#L11.
 */
export const validationErrors =
  (typeAlias: string) =>
  (errors: t.Errors): string => {
    return errors
      .map((error) =>
        pipe(
          NEA.fromReadonlyArray(error.context),
          O.map((context) => {
            const name = typeAlias || NEA.head(context).type.name;
            const lastType = NEA.last(context).type.name;
            const path = name + error.context.map((c) => c.key).join('.');
            return pipe(
              Json.stringify(error.value),
              E.getOrElse(() => error.value),
              (value) => `Invalid value '${value}' supplied to ${path}, expected ${lastType}.`
            );
          }),
          O.getOrElse(() => `Unable to decode ${typeAlias}, but no error reported`)
        )
      )
      .join('\n');
  };

export function decode<A, O, I>(codecName: string, codec: t.Type<A, O, I>, u: I): E.Either<string, A> {
  return pipe(
    codec.decode(u),
    E.mapLeft((errors) => validationErrors(codecName)(errors))
  );
}

/**
 * Decodes input `value` with `codec`. When decoding fails, calls the `orElse` function with the error message from
 * `validationErrors`.
 */
export function decodeOrElse<A, O, I, E>(
  codecName: string,
  codec: t.Type<A, O, I>,
  value: I,
  orElse: (errors: string) => E
): E | A {
  return pipe(decode(codecName, codec, value), E.getOrElseW(orElse));
}
