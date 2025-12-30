/**
 * Tempo Utility Functions
 *
 * Since Tempo is EVM-compatible, we can reuse Ethereum utilities

 */

import { bip32 } from '@bitgo/secp256k1';
import { VALID_ADDRESS_REGEX } from './constants';

/**
 * Check if address is valid Ethereum-style address
 * TODO: Replace with ETH utils when implementing
 */
export function isValidAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }
  return VALID_ADDRESS_REGEX.test(address);
}

/**
 * Check if public key is valid (BIP32 xpub format)
 * TODO: Replace with ETH utils when implementing
 */
export function isValidPublicKey(publicKey: string): boolean {
  if (typeof publicKey !== 'string') {
    return false;
  }
  try {
    const hdNode = bip32.fromBase58(publicKey);
    return hdNode.isNeutered();
  } catch (e) {
    return false;
  }
}

/**
 * Check if private key is valid (BIP32 xprv format)
 * TODO: Replace with ETH utils when implementing
 */
export function isValidPrivateKey(privateKey: string): boolean {
  if (typeof privateKey !== 'string') {
    return false;
  }
  try {
    const hdNode = bip32.fromBase58(privateKey);
    return !hdNode.isNeutered();
  } catch (e) {
    return false;
  }
}

const utils = {
  isValidAddress,
  isValidPublicKey,
  isValidPrivateKey,
};

export default utils;
