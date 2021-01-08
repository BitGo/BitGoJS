import { ByteArray, Keys } from 'casper-client-sdk';
import { DefaultKeys } from '../baseCoin/iface';

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
  if (address === '') {
    return false;
  }
  if (address.match(/^[0-9a-fA-F]{66}$/)) {
    return false;
  }
  return true;
}

/**
 * validate public key
 *
 * @param {string} address public key address
 * @returns {boolean} return a bool
 */
export function isValidAddress(address: string): boolean {
  if (!address || address.trim().length === 0) {
    return false;
  }
  if (!address.match(/^[0-9a-fA-F]{64}$/)) {
    return false;
  }
  return true;
}
