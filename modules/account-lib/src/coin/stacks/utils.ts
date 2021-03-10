import {
  AddressHashMode,
  StacksTransaction,
  TransactionVersion,
  addressFromVersionHash,
  addressHashModeToVersion,
  addressToString,
  validateStacksAddress,
} from '@stacks/transactions';
import BigNumber from 'bignumber.js';

/**
 * Encodes a buffer as a `0x` prefixed lower-case hex string.
 *
 * @param {Buffer} buff - a buffer with a hexadecimal string
 * @returns {string} - the hexadecimal string prefixed with "0x"
 */
export function bufferToHexPrefixString(buff: Buffer): string {
  return '0x' + buff.toString('hex');
}

/**
 * @param hex
 */
export function removeHexPrefix(hex: string): string {
  if (hex.startsWith('0x')) return hex.slice(2);
  else return hex;
}

/**
 * @param publicKeyHash
 * @param hashMode
 * @param transactionVersion
 */
function getAddressFromPublicKeyHash(
  publicKeyHash: Buffer,
  hashMode: AddressHashMode,
  transactionVersion: TransactionVersion,
): string {
  const addrVer = addressHashModeToVersion(hashMode, transactionVersion);
  if (publicKeyHash.length !== 20) {
    throw new Error('expected 20-byte pubkeyhash');
  }
  const addr = addressFromVersionHash(addrVer, publicKeyHash.toString('hex'));
  const addrString = addressToString(addr);
  return addrString;
}

/**
 * @param tx
 */
export function getTxSenderAddress(tx: StacksTransaction): string {
  if (tx.auth.spendingCondition !== null && tx.auth.spendingCondition !== undefined) {
    const spendingCondition = tx.auth.spendingCondition;
    const txSender = getAddressFromPublicKeyHash(
      Buffer.from(spendingCondition.signer, 'hex'),
      spendingCondition.hashMode as number,
      tx.version,
    );
    return txSender;
  } else throw new Error('spendingCondition should not be null');
}

/**
 * Returns whether or not the string is a valid amount number
 *
 * @param {string} amount - the string to validate
 * @returns {boolean} - the validation result
 */
export function isValidAmount(amount: string): boolean {
  const bigNumberAmount = new BigNumber(amount);
  return bigNumberAmount.isInteger() && bigNumberAmount.isGreaterThanOrEqualTo(0);
}

/**
 * Returns whether or not the string is a valid protocol address
 *
 * @param {string} address - the address to be validated
 * @returns {boolean} - the validation result
 */
export function isValidAddress(address: string): boolean {
  return validateStacksAddress(address);
}

/**
 * Returns whether or not the string is a valid protocol transaction id or not.
 *
 * A valid transaction id is a SHA-512/256 hash of a serialized transaction; see
 * "txidFromData()" in @stacks/transaction.
 *
 * @param {string} txId - the transaction id to be validated
 * @returns {boolean} - the validation result
 */
export function isValidTransactionId(txId: string): boolean {
  if (txId.length !== 64 && txId.length !== 66) return false;
  const noPrefix = removeHexPrefix(txId);
  if (noPrefix.length !== 64) return false;

  return allHexChars(noPrefix);
}

/**
 * Returns whether or not the string is a valid protocol public key
 *
 * @param {string} pub - the  public key to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPublicKey(pub: string): boolean {
  if (pub.length !== 66 && pub.length !== 130) return false;

  const firstByte = pub.slice(0, 2);

  if (pub.length === 130) {
    if (firstByte === '04') return allHexChars(pub);
    else return false;
  }

  if (firstByte !== '02' && firstByte !== '03') return false;

  return allHexChars(pub);
}

/**
 * Returns whether or not the string is a valid protocol private key
 *
 * @param {string} prv - the  private key to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPrivateKey(prv: string): boolean {
  if (prv.length !== 64 && prv.length !== 66) return false;

  if (prv.length === 66 && prv.slice(64) !== '01') return false;

  return allHexChars(prv);
}

/**
 * Returns whether or not the string is a composed of hex chars only
 *
 * @param {string} maybe - the  string to be validated
 * @returns {boolean} - the validation result
 */
function allHexChars(maybe: string): boolean {
  return maybe.match(/^[0-9a-f]+$/i) !== null;
}
