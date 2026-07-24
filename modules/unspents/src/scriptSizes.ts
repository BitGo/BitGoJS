import { PositiveInteger } from './types';

/**
 * Overhead size for a pushdata element in a script
 * @param i
 */
export function pushdataEncodingLength(i: number): number {
  /*
   * https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#push-operators
   * Pushing any other byte sequence up to 75 bytes must use the normal data push (opcode byte n, with n the number of bytes, followed n bytes of data being pushed).
   * Pushing 76 to 255 bytes must use OP_PUSHDATA1.
   * Pushing 256 to 520 bytes must use OP_PUSHDATA2.
   * OP_PUSHDATA4 can never be used, as pushes over 520 bytes are not allowed, and those below can be done using other operators.
   */
  if (i < 76) {
    return 1;
  }
  if (i < 255) {
    return 2;
  }
  if (i < 520) {
    return 3;
  }
  throw new Error(`invalid pushdata size`);
}

/**
 * https://developer.bitcoin.org/reference/transactions.html#compactsize-unsigned-integers
 * https://github.com/bitcoinjs/varuint-bitcoin/blob/1d5b253/index.js#L79
 * @param integer
 * @return {number} - The compact size the integer requires when serialized in a transaction
 */
export function compactSize(integer: number): number {
  if (!PositiveInteger.is(integer)) {
    throw new TypeError(`expected positive integer`);
  }
  if (integer <= 252) {
    return 1;
  }
  if (integer <= 0xffff) {
    return 3;
  }
  if (integer <= 0xffffffff) {
    return 5;
  }
  return 9;
}
