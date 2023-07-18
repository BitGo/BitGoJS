import * as _ from 'lodash';
import { AccountId, PrivateKey, PublicKey, TokenId, TransactionId } from '@hashgraph/sdk';
import { proto } from '@hashgraph/proto';
import BigNumber from 'bignumber.js';
import * as stellar from 'stellar-sdk';
import { AddressDetails } from './iface';
import url from 'url';
import { toHex, toUint8Array, UtilsError } from '@bitgo/sdk-core';
import { BaseCoin, coins, HederaToken } from '@bitgo/statics';
export { toHex, toUint8Array };

const MAX_TINYBARS_AMOUNT = new BigNumber(2).pow(63).minus(1);

/**
 * Returns whether the string is a valid Hedera account address
 *
 * In any form, `shard` and `realm` are assumed to be 0 if not provided.
 *
 * @param {string} address - The address to be validated
 * @returns {boolean} - The validation result
 */
export function isValidAddress(address: string): boolean {
  if (_.isEmpty(address) || !address.match(/^\d+(?:(?=\.)(\.\d+){2}|(?!\.))$/)) {
    return false;
  }
  try {
    const acc = AccountId.fromString(address);
    return !_.isNaN(acc.num);
  } catch (e) {
    return false;
  }
}

/**
 * Returns whether the string is a valid Hedera transaction id
 *
 * @param {string} txId - The transaction id to be validated
 * @returns {boolean} - The validation result
 */
export function isValidTransactionId(txId: string): boolean {
  if (_.isEmpty(txId)) {
    return false;
  }
  try {
    const tx = TransactionId.fromString(txId);
    if (_.isNil(tx.accountId)) {
      return false;
    }
    return !_.isNaN(tx.accountId.num);
  } catch (e) {
    return false;
  }
}

/**
 Returns whether the string is a valid Hedera public key
 *
 * @param {string} key - The public key to be validated
 * @returns {boolean} - The validation result
 */
export function isValidPublicKey(key: string): boolean {
  if (_.isEmpty(key)) {
    return false;
  }
  try {
    const pubKey = PublicKey.fromString(key.toLowerCase());
    return !_.isNaN(pubKey.toString());
  } catch (e) {
    return false;
  }
}

/**
 * Checks whether nodeJS.process exist and if a node version is defined to determine if this is an nodeJS environment
 *
 * @returns {boolean} - The validation result
 */
export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && typeof process.versions.node !== 'undefined';
}

/**
 * Calculate the current time with nanoseconds precision
 *
 * @returns {string} - The current time in seconds
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
 * Returns whether the string is a valid timestamp
 *
 * Nanoseconds are optional and can be passed after a dot, for example: 1595374723.356981689
 *
 * @param {string} time - The timestamp to be validated
 * @returns {boolean} - The validation result
 */
export function isValidTimeString(time: string): boolean {
  return /^\d+(\.\d+)?$/.test(time);
}

/**
 * Returns whether the string is a valid amount number
 *
 * @param {string} amount - The string to validate
 * @returns {boolean} - The validation result
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
 * @returns {boolean} - The validation result
 */
export function isValidRawTransactionFormat(rawTransaction: any): boolean {
  const isAlphaNumeric = typeof rawTransaction === 'string' && /^[\da-fA-F]+$/.test(rawTransaction);
  const isValidBuffer = Buffer.isBuffer(rawTransaction) && !!Uint8Array.from(rawTransaction);

  return isAlphaNumeric || isValidBuffer;
}

/**
 * Returns a string representation of an {proto.IAccountID} object
 *
 * @param {proto.IAccountID} accountId - Account id to be cast to string
 * @returns {string} - The string representation of the {proto.IAccountID}
 */
export function stringifyAccountId({ shardNum, realmNum, accountNum }: proto.IAccountID): string {
  return `${shardNum || 0}.${realmNum || 0}.${accountNum}`;
}

/**
 * Returns a string representation of an {proto.ITokenID} object
 *
 * @param {proto.ITokenID} - token id to be cast to string
 * @returns {string} - the string representation of the {proto.ITokenID}
 */
export function stringifyTokenId({ shardNum, realmNum, tokenNum }: proto.ITokenID): string {
  return `${shardNum || 0}.${realmNum || 0}.${tokenNum}`;
}

/**
 * Returns a string representation of an {proto.ITimestamp} object
 *
 * @param {proto.ITimestamp} timestamp - Timestamp to be cast to string
 * @returns {string} - The string representation of the {proto.ITimestamp}
 */
export function stringifyTxTime({ seconds, nanos }: proto.ITimestamp): string {
  return `${seconds}.${nanos}`;
}

/**
 * Remove the specified prefix from a string only if it starts with that prefix
 *
 * @param {string} prefix - The prefix to be removed
 * @param {string} key - The original string, usually a private or public key
 * @returns {string} - The string without prefix
 */
export function removePrefix(prefix: string, key: string): string {
  if (key.startsWith(prefix)) {
    return key.slice(prefix.length);
  }
  return key;
}

/**
 * Check if this is a valid memo
 *
 * @param {string} memo
 * @returns {boolean}
 */
export function isValidMemo(memo: string): boolean {
  return !(_.isEmpty(memo) || Buffer.from(memo).length > 100);
}

/**
 * Uses the native hashgraph SDK function to get a raw key.
 *
 * @param {string} prv - Private key
 * @returns {PrivateKey}
 */
export function createRawKey(prv: string): PrivateKey {
  return PrivateKey.fromString(prv);
}

/**
 * Converts a stellar public key to ed25519 hex format
 *
 * @param {string} stellarPub
 * @returns {string}
 */
export function convertFromStellarPub(stellarPub: string): string {
  if (!stellar.StrKey.isValidEd25519PublicKey(stellarPub)) {
    throw new Error('Not a valid stellar pub.');
  }

  const rawKey: Buffer = stellar.StrKey.decodeEd25519PublicKey(stellarPub);
  return rawKey.toString('hex');
}

/**
 * Checks if two addresses have the same base address
 *
 * @param {String} address
 * @param {String} baseAddress
 * @returns {boolean}
 */
export function isSameBaseAddress(address: string, baseAddress: string): boolean {
  if (!isValidAddressWithPaymentId(address)) {
    throw new UtilsError(`invalid address: ${address}`);
  }
  return getBaseAddress(address) === getBaseAddress(baseAddress);
}

/**
 * Returns the base address portion of an address
 *
 * @param {String} address
 * @returns {String} - the base address
 */
export function getBaseAddress(address: string): string {
  const addressDetails = getAddressDetails(address);
  return addressDetails.address;
}

/**
 * Process address into address and memo id
 *
 * @param {string} rawAddress
 * @returns {AddressDetails} - object containing address and memo id
 */
export function getAddressDetails(rawAddress: string): AddressDetails {
  const addressDetails = url.parse(rawAddress);
  const queryDetails = addressDetails.query ? new URLSearchParams(addressDetails.query) : undefined;
  const baseAddress = addressDetails.pathname as string;
  if (!isValidAddress(baseAddress)) {
    throw new UtilsError(`invalid address: ${rawAddress}`);
  }

  // address doesn't have a memo id or memoId is empty
  if (baseAddress === rawAddress) {
    return {
      address: rawAddress,
      memoId: undefined,
    };
  }

  if (!queryDetails || _.isNil(queryDetails.get('memoId'))) {
    // if there are more properties, the query details need to contain the memo id property
    throw new UtilsError(`invalid address with memo id: ${rawAddress}`);
  }
  const memoId = queryDetails.get('memoId') as string;
  if (!isValidMemo(memoId)) {
    throw new UtilsError(`invalid address: '${rawAddress}', memoId is not valid`);
  }

  return {
    address: baseAddress,
    memoId,
  };
}

/**
 * Validate and return address with appended memo id
 *
 * @param {AddressDetails} addressDetails - Address which to append memo id
 * @returns {string} - Address with appended memo id
 */
export function normalizeAddress({ address, memoId }: AddressDetails): string {
  if (memoId && isValidMemo(memoId)) {
    return `${address}?memoId=${memoId}`;
  }
  return address;
}

/**
 * Return boolean indicating whether input is a valid address with memo id
 *
 * @param {string} address - Address in the form <address>?memoId=<memoId>
 * @returns {boolean} - True if input is a valid address
 */
export function isValidAddressWithPaymentId(address: string): boolean {
  try {
    const addressDetails = getAddressDetails(address);
    return address === normalizeAddress(addressDetails);
  } catch (e) {
    return false;
  }
}

/**
 * Build hedera {proto.TokenID} object from token ID string
 *
 * @param {string} tokenID - The token ID to build
 * @returns {proto.TokenID} - The resulting proto TokenID object
 */
export function buildHederaTokenID(tokenID: string): proto.TokenID {
  const tokenData = TokenId.fromString(tokenID);
  return new proto.TokenID({
    tokenNum: tokenData.num,
    realmNum: tokenData.realm,
    shardNum: tokenData.shard,
  });
}

/**
 * Build hedera {proto.AccountID} object from account ID string
 *
 * @param {string} accountID - The account ID to build
 * @returns {proto} - The resulting proto AccountID object
 */
export function buildHederaAccountID(accountID: string): proto.AccountID {
  const accountId = AccountId.fromString(accountID);
  return new proto.AccountID({
    shardNum: accountId.shard,
    realmNum: accountId.realm,
    accountNum: accountId.num,
  });
}

/**
 * Check if Hedera token ID is valid and supported
 *
 * @param {string} tokenId - The token ID to validate
 * @returns {boolean} - True if tokenId is valid and supported
 */
export function isValidHederaTokenID(tokenId: string): boolean {
  const isFormatValid = !_.isEmpty(tokenId) && !!tokenId.match(/^\d+(?:(?=\.)(\.\d+){2}|(?!\.))$/);
  const isTokenSupported = getHederaTokenNameFromId(tokenId) !== undefined;

  return isFormatValid && isTokenSupported;
}

/**
 * Get the associated hedera token ID from token name, if supported
 *
 * @param {string} tokenName - The hedera token name
 * @returns {boolean} - The associated token ID or undefined if not supported
 */
export function getHederaTokenIdFromName(tokenName: string): string | undefined {
  if (coins.has(tokenName)) {
    const token = coins.get(tokenName);
    if (token.isToken && token instanceof HederaToken) {
      return token.tokenId;
    }
  }

  return undefined;
}

/**
 * Get the associated hedera token from token ID, if supported
 *
 * @param tokenId - The token address
 * @returns {BaseCoin} - BaseCoin object for the matching token
 */
export function getHederaTokenNameFromId(tokenId: string): Readonly<BaseCoin> | undefined {
  const tokensArray = coins
    .filter((coin) => {
      return coin instanceof HederaToken && coin.tokenId === tokenId;
    })
    .map((token) => token); // flatten coin map to array

  return tokensArray.length > 0 ? tokensArray[0] : undefined;
}

/**
 * Return boolean indicating whether input is a valid token transfer transaction
 *
 * @param {proto.ICryptoTransferTransactionBody | null} transferTxBody is a transfer transaction body
 * @returns {boolean} true is input is a valid token transfer transaction
 */
export function isTokenTransfer(transferTxBody: proto.ICryptoTransferTransactionBody | null): boolean {
  return !!transferTxBody && !!transferTxBody.tokenTransfers && transferTxBody.tokenTransfers.length > 0;
}
