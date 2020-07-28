import * as _ from 'lodash';
import { AccountId } from '@hashgraph/sdk/lib/account/AccountId';
import { Ed25519PublicKey, TransactionId } from '@hashgraph/sdk';
import * as hex from '@stablelib/hex';
import BigNumber from 'bignumber.js';

const MAX_TINYBARS_AMOUNT = new BigNumber(2).pow(63).minus(1);

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

/**
 * Returns whether or not the string is a valid Hedera public key
 *
 * @param {string} key - the  public key to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPublicKey(key: string): boolean {
  if (_.isEmpty(key)) {
    return false;
  }
  try {
    const pubKey = Ed25519PublicKey.fromString(key.toLowerCase());
    return !_.isNaN(pubKey.toString());
  } catch (e) {
    return false;
  }
}

/**
 * Returns an hex string of the given buffer
 *
 * @param {Buffer | Uint8Array} buffer - the buffer to be converted to hex
 * @returns {string} - the hex value
 */
export function toHex(buffer: Buffer | Uint8Array): string {
  return hex.encode(buffer, true);
}

/**
 * Returns a Uint8Array of the given hex string
 *
 * @param {string} str - the hex string to be converted
 * @returns {string} - the Uint8Array value
 */
export function toUint8Array(str: string): Uint8Array {
  return hex.decode(str);
}

/**
 * Checks whether nodeJS.process exist and if a node version is defined to determine if this is an nodeJS environment
 *
 * @returns {boolean} - the validation result
 */
export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && typeof process.versions.node !== 'undefined';
}

/**
 * Calculate the current time with nanoseconds precision
 *
 * @returns {string} the current time in seconds
 */
export function getCurrentTime(): string {
  if (isNodeEnvironment()) {
    const nanos = process.hrtime()[1];
    const seconds = (Date.now() * 1000000 + nanos) / 1000000000;
    return seconds.toFixed(9);
  } else {
    return (performance.timeOrigin + performance.now()).toFixed(9);
  }
}

/**
 * Returns whether or not the string is a valid timestamp. Nanoseconds are optional and can be passed after a dot, for
 * example: 1595374723.356981689
 *
 * @param {string} time - the timestamp to be validated
 * @returns {boolean} the validation result
 */
export function isValidTimeString(time: string) {
  return /^[0-9]+(\.[0-9]+)?$/.test(time);
}

/**
 * Returns whether or not the string is a valid amount number
 *
 * @param {string} amount - the string to validate
 * @returns {boolean} - the validation result
 */
export function isValidAmount(amount: string): boolean {
  const bigNumberAmount = new BigNumber(amount);
  return (
    bigNumberAmount.isInteger() &&
    bigNumberAmount.isGreaterThanOrEqualTo(0) &&
    bigNumberAmount.isLessThanOrEqualTo(MAX_TINYBARS_AMOUNT)
  );
}
