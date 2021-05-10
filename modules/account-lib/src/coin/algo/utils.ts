import algosdk from 'algosdk';
import tweetnacl from 'tweetnacl';
import { toUint8Array } from '../hbar/utils';

/**
 * Returns whether or not the string is a valid protocol address
 *
 * @param {string} address - the address to be validated
 * @returns {boolean} - the validation result
 */
export function isValidAddress(address: string): boolean {
  return algosdk.isValidAddress(address);
}

/**
 * Returns whether or not the string is a valid protocol transaction id or not.
 *
 * @param {string} txId - the transaction id to be validated
 * @returns {boolean} - the validation result
 */
export function isValidTransactionId(txId: string): boolean {
  if (txId.length !== 104) return false;

  return allHexChars(txId);
}

/**
 * Returns whether or not the string is a valid protocol public key or
 * extended public key.
 *
 * @param {string} pub - the  public key to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPublicKey(pub: string): boolean {
  if (pub.length !== 64) return false;

  if (!allHexChars(pub)) return false;

  // all (?) 32 byte values can be valid public keys
  return true;
}

/**
 * Returns whether or not the string is a valid protocol private key, or extended
 * private key.
 *
 * @param {string} prv - the private key (or extended private key) to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPrivateKey(prv: string): boolean {
  if (prv.length !== 64) return false;

  if (!allHexChars(prv)) return false;

  try {
    tweetnacl.box.keyPair.fromSecretKey(toUint8Array(prv));
  } catch (e) {
    return false;
  }

  return true;
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
