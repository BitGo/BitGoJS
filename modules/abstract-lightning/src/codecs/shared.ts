import * as t from 'io-ts';

// codec utilities

export function getCodecPair<C extends t.Mixed>(
  innerCodec: C
): t.UnionC<[t.TypeC<{ lnbtc: C }>, t.TypeC<{ tlnbtc: C }>]> {
  return t.union([t.type({ lnbtc: innerCodec }), t.type({ tlnbtc: innerCodec })]);
}
