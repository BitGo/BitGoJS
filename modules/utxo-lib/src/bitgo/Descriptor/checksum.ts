// Converted to Javascript by Jose-Luis Landabaso, 2023 - https://bitcoinerlab.com
// Source: https://github.com/bitcoin/bitcoin/blob/master/src/script/descriptor.cpp
// Distributed under the MIT software license
const PolyMod = (c: bigint, val: bigint): bigint => {
  const c0: bigint = c >> BigInt(35);
  c = ((c & BigInt(0x7ffffffff)) << BigInt(5)) ^ val;
  if (c0 & BigInt(1)) c ^= BigInt(0xf5dee51989);
  if (c0 & BigInt(2)) c ^= BigInt(0xa9fdca3312);
  if (c0 & BigInt(4)) c ^= BigInt(0x1bab10e32d);
  if (c0 & BigInt(8)) c ^= BigInt(0x3706b1677a);
  if (c0 & BigInt(16)) c ^= BigInt(0x644d626ffd);
  return c;
};

export const CHECKSUM_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/**
 * Implements the Bitcoin descriptor's checksum algorithm described in
 * {@link https://github.com/bitcoin/bitcoin/blob/master/src/script/descriptor.cpp}
 */
export const DescriptorChecksum = (span: string): string => {
  const INPUT_CHARSET =
    '0123456789()[],\'/*abcdefgh@:$%{}IJKLMNOPQRSTUVWXYZ&+-.;<=>?!^_|~ijklmnopqrstuvwxyzABCDEFGH`#"\\ ';

  let c = BigInt(1);
  let cls = BigInt(0);
  let clscount = BigInt(0);
  for (const ch of span as string) {
    const pos = BigInt(INPUT_CHARSET.indexOf(ch));
    if (pos === -BigInt(1)) return '';
    c = PolyMod(c, pos & BigInt(31));
    cls = cls * BigInt(3) + (pos >> BigInt(5));
    if (++clscount === BigInt(3)) {
      c = PolyMod(c, cls);
      cls = BigInt(0);
      clscount = BigInt(0);
    }
  }
  if (clscount > BigInt(0)) c = PolyMod(c, cls);
  for (let j = 0; j < 8; ++j) c = PolyMod(c, BigInt(0));
  c ^= BigInt(1);

  let ret = '';
  for (let j = 0; j < 8; ++j) {
    const index = (c >> (BigInt(5) * (BigInt(7) - BigInt(j)))) & BigInt(31);
    if (index < 0 || index > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Error: could not compute checksum, invalid index ${index}`);
    }
    ret += CHECKSUM_CHARSET[Number(index)];
  }
  return ret;
};
