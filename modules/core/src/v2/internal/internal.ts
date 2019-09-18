/**
 * @prettier
 * @hidden
 */

/**
 */
import * as Bluebird from 'bluebird';
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { isUndefined } from 'lodash';

const co = Bluebird.coroutine;

/**
 * Internal function to centralize this route for wallet-scoped and enterprise-scoped queries
 * Params must contain either walletId or enterpriseId
 * @param params Id to query for pending transaction
 * @param baseCoin The coin object
 * @param bitgo The BitGo object
 * @returns result of the query
 */
export function getFirstPendingTransaction(
  params: { walletId?: string; enterpriseId?: string },
  baseCoin: BaseCoin,
  bitgo: BitGo
): Bluebird<any> {
  return co(function*() {
    // These errors should never happen when this is called from wallet.js or enterprise.js
    if (isUndefined(baseCoin)) {
      throw new Error('Must provide baseCoin');
    }
    if (isUndefined(bitgo)) {
      throw new Error('Must provide BitGo object');
    }
    if (isUndefined(params.walletId) && isUndefined(params.enterpriseId)) {
      throw new Error('Must provide either walletId or enterpriseId');
    }
    return bitgo
      .get(baseCoin.url('/tx/pending/first'))
      .query(params)
      .result();
  }).call(this);
}

/**
 * convert a 4 element Uint8Array to a 4 byte Number
 *
 * @param bytes
 * @return 4 byte number
 */
export function bytesToWord(bytes?: Uint8Array): number {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 4) {
    throw new Error('bytes must be a Uint8Array with length 4');
  }

  return bytes.reduce((num, byte) => num * 0x100 + byte, 0);
}
