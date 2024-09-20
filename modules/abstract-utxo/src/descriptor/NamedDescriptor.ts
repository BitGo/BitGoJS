import * as t from 'io-ts';

export const NamedDescriptor = t.type({
  name: t.string,
  value: t.string,
});

export type NamedDescriptor = t.TypeOf<typeof NamedDescriptor>;
