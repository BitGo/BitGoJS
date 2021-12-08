/**
 * @prettier
 * @hidden
 */

/**
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { isUndefined } from 'lodash';

/**
 * Internal function to centralize this route for wallet-scoped and enterprise-scoped queries
 * Params must contain either walletId or enterpriseId
 * @param params Id to query for pending transaction
 * @param baseCoin The coin object
 * @param bitgo The BitGo object
 * @returns result of the query
 */
export async function getFirstPendingTransaction(
  params: { walletId?: string; enterpriseId?: string },
  baseCoin: BaseCoin,
  bitgo: BitGo
): Promise<any> {
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
  return await bitgo.get(baseCoin.url('/tx/pending/first')).query(params).result();
}
