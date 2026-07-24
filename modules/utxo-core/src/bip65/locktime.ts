/*

Modified version of https://github.com/bitcoinjs/bip65/blob/master/index.js

BIP0065: https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki

*/

// https://github.com/bitcoin/bitcoin/blob/v28.0/src/script/script.h#L44-L46
const LOCKTIME_THRESHOLD = 500_000_000;

/**
 * @param obj
 * @return number
 */
export function encodeLocktime(obj: Date | { blocks: number }): number {
  if (obj instanceof Date) {
    if (!Number.isFinite(obj.getTime())) {
      throw new Error('invalid date');
    }
    const seconds = Math.floor(obj.getTime() / 1000);
    if (seconds < LOCKTIME_THRESHOLD) {
      throw new TypeError('Expected Number utc >= ' + LOCKTIME_THRESHOLD);
    }

    return seconds;
  }

  const { blocks } = obj;

  if (!Number.isFinite(blocks) || !Number.isInteger(blocks)) {
    throw new TypeError('Expected Number blocks');
  }

  if (blocks >= LOCKTIME_THRESHOLD) {
    throw new TypeError('Expected Number blocks < ' + LOCKTIME_THRESHOLD);
  }

  return blocks;
}
