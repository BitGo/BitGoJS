/** Convert input to bigint or number. Throws error if input cannot be converted to a safe integer number */
export function toTNumber(v: number | bigint, t: 'bigint' | 'number'): number | bigint {
  if (t === 'bigint') {
    return BigInt(v);
  }
  if (t === 'number') {
    const i = Number(v);
    if (Number.isSafeInteger(i)) {
      return i;
    }
    throw new Error(`number is not a safe integer`);
  }
  throw new Error();
}
