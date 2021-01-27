import BigNumber from 'bignumber.js';
import { ByteArray, Keys } from 'casper-client-sdk';
import { DefaultKeys } from '../baseCoin/iface';

const MAX_MOTES_AMOUNT = new BigNumber(10).pow(154).minus(1);

/**
 * Returns the account hash from a public key
 *
 * @param {DefaultKeys} keys keypair
 * @returns {ByteArray} account hash as ByteArray
 */
export function getAccountHash(keys: DefaultKeys): ByteArray {
  const publicKey = Buffer.from(keys.pub); // first two characters identify a public key
  const privateKey = keys.prv ? Buffer.from(keys.prv) : undefined;
  return new Keys.Secp256K1(publicKey, privateKey!).accountHash();
}

/**
 * validate public key
 *
 * @param {string} address public key address
 * @returns {boolean} return a bool
 */
export function isValidPublicKey(address: string): boolean {
  if (!address || address.trim().length === 0) {
    return false;
  }
  if (!address.match(/^[0-9a-fA-F]{66}$/)) {
    return false;
  }
  return true;
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
    bigNumberAmount.isLessThan(MAX_MOTES_AMOUNT)
  );
}

/**
 * Returns whether or not the number is a valid amount
 *
 * @param {string} id - the number to validate
 * @returns {boolean} - the validation result
 */
export function isValidTransferId(id: number): boolean {
  const bigNumberAmount = new BigNumber(id);
  return bigNumberAmount.isInteger() && bigNumberAmount.isGreaterThanOrEqualTo(0);
}
