import * as _ from 'lodash';

import { AccountId } from '@hashgraph/sdk/lib/account/AccountId';
import { TransactionId } from '@hashgraph/sdk';

/**
 * Returns whether or not the string is a valid Hedera account.
 *
 * In any form, `shard` and `realm` are assumed to be 0 if not provided.
 *
 * @param {string} address - the address to be validated
 * @returns {boolean} - the validation result
 */
export function isValidAddress(address: string): boolean {
  if (_.isEmpty(address)) {
    return false;
  }
  try {
    const acc = AccountId.fromString(address);
    return !_.isNaN(acc.account);
  } catch (e) {
    return false;
  }
}

/**
 * Returns whether or not the string is a valid Hedera transaction id or not.
 *
 * @param {string} txId - the transaction id to be validated
 * @returns {boolean} - the validation result
 */
export function isValidTransactionId(txId: string): boolean {
  if (_.isEmpty(txId)) {
    return false;
  }
  try {
    const tx = TransactionId.fromString(txId);
    return !_.isNaN(tx.accountId.account);
  } catch (e) {
    return false;
  }
}
