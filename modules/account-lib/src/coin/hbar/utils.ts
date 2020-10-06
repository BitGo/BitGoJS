import * as _ from 'lodash';
import { TransactionId, AccountId, Ed25519PublicKey, Ed25519PrivateKey } from '@hashgraph/sdk';
import * as hex from '@stablelib/hex';
import BigNumber from 'bignumber.js';
import * as stellar from 'stellar-sdk';
import { proto } from '../../../resources/hbar/protobuf/hedera';

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

/**
 * Returns whether the provided raw transaction accommodates to bitgo's preferred format
 *
 * @param {any} rawTransaction - The raw transaction to be checked
 * @returns {boolean} the validation result
 */
export function isValidRawTransactionFormat(rawTransaction: any): boolean {
  if (
    (typeof rawTransaction === 'string' && /^[0-9a-fA-F]+$/.test(rawTransaction)) ||
    (Buffer.isBuffer(rawTransaction) && Uint8Array.from(rawTransaction))
  ) {
    return true;
  }
  return false;
}

/**
 * Returns a string representation of an {proto.IAccountID} object
 *
 * @param {proto.IAccountID} - account id to be cast to string
 * @returns {string} - the string representation of the {proto.IAccountID}
 */
export function stringifyAccountId({ shardNum, realmNum, accountNum }: proto.IAccountID): string {
  return `${shardNum || 0}.${realmNum || 0}.${accountNum}`;
}

/**
 * Returns a string representation of an {proto.ITimestamp} object
 *
 * @param {proto.ITimestamp} - timestamp to be cast to string
 * @returns {string} - the string representation of the {proto.ITimestamp}
 */
export function stringifyTxTime({ seconds, nanos }: proto.ITimestamp) {
  return `${seconds}.${nanos}`;
}

/**
 * Remove the specified prefix from a string only if it starts with that prefix
 *
 * @param {string} prefix The prefix to be removed
 * @param {string} key The original string, usually a private or public key
 * @returns {string} The string without prefix
 */
export function removePrefix(prefix: string, key: string): string {
  if (key.startsWith(prefix)) {
    return key.slice(prefix.length);
  }
  return key;
}

/**
 * Check if this is a valid memo or not.
 *
 * @param memo
 */
export function isValidMemo(memo: string): boolean {
  if (Buffer.from(memo).length > 100) {
    return false;
  }
  return true;
}

/**
 * Uses the native hashgraph SDK function to get a raw key.
 *
 * @param prv
 */
export function createRawKey(prv: string): Ed25519PrivateKey {
  return Ed25519PrivateKey.fromString(prv);
}

/**
 * Converts an stellar public key to a ed25519 hex format.
 *
 * @param stellarPub
 * @param prv
 */
export function convertFromStellarPub(stellarPub: string): string {
  if (!stellar.StrKey.isValidEd25519PublicKey(stellarPub)) {
    throw new Error('Not a valid stellar pub.');
  }

  const rawKey: Buffer = stellar.StrKey.decodeEd25519PublicKey(stellarPub);
  return rawKey.toString('hex');
}
