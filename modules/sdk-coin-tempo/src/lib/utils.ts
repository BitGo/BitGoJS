import { VALID_ADDRESS_REGEX, VALID_PUBLIC_KEY_REGEX } from './constants';

/**
 * Utility functions for Tempo
 */

/**
 * Check if the address is valid
 * @param address
 */
export function isValidAddress(address: string): boolean {
  // TODO: Implement proper address validation for Tempo
  return VALID_ADDRESS_REGEX.test(address);
}

/**
 * Check if the public key is valid
 * @param publicKey
 */
export function isValidPublicKey(publicKey: string): boolean {
  // TODO: Implement proper public key validation for Tempo
  return VALID_PUBLIC_KEY_REGEX.test(publicKey);
}

/**
 * Check if the private key is valid
 * @param privateKey
 */
export function isValidPrivateKey(privateKey: string): boolean {
  // TODO: Implement proper private key validation for Tempo
  return privateKey.length === 64;
}

const utils = {
  isValidAddress,
  isValidPublicKey,
  isValidPrivateKey,
};

export default utils;
