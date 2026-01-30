/**
 * Utility functions for Proton (XPR Network)
 */

import { Name, PublicKey, PrivateKey, Asset } from '@greymass/eosio';
import {
  VALID_ACCOUNT_NAME_REGEX,
  VALID_PUBLIC_KEY_REGEX,
  VALID_PRIVATE_KEY_REGEX,
  XPR_SYMBOL,
  XPR_PRECISION,
} from './constants';

/**
 * Check if the address is a valid Proton account name
 * Proton (EOSIO) addresses are human-readable account names with specific constraints:
 * - Max 12 characters
 * - Only lowercase letters a-z, numbers 1-5, and dots
 * - Cannot start or end with a dot
 *
 * @param address - the account name to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Must match basic regex
  if (!VALID_ACCOUNT_NAME_REGEX.test(address)) {
    return false;
  }

  // Cannot start or end with a dot
  if (address.startsWith('.') || address.endsWith('.')) {
    return false;
  }

  // Additional validation using the library
  try {
    const name = Name.from(address);
    // The library truncates invalid names, so verify it matches
    return name.toString() === address;
  } catch {
    return false;
  }
}

/**
 * Check if the public key is valid
 * Supports both modern (PUB_K1_...) and legacy (EOS...) formats
 *
 * @param publicKey - the public key to validate
 * @returns true if valid, false otherwise
 */
export function isValidPublicKey(publicKey: string): boolean {
  if (!publicKey || typeof publicKey !== 'string') {
    return false;
  }

  // First check against regex
  if (!VALID_PUBLIC_KEY_REGEX.test(publicKey)) {
    return false;
  }

  // Then validate using the library (includes checksum validation)
  try {
    PublicKey.from(publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the private key is valid
 * Supports both modern (PVT_K1_...) and WIF (5...) formats
 *
 * @param privateKey - the private key to validate
 * @returns true if valid, false otherwise
 */
export function isValidPrivateKey(privateKey: string): boolean {
  if (!privateKey || typeof privateKey !== 'string') {
    return false;
  }

  // First check against regex
  if (!VALID_PRIVATE_KEY_REGEX.test(privateKey)) {
    return false;
  }

  // Then validate using the library
  try {
    PrivateKey.from(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the private key is a valid raw hex string (32 bytes / 64 hex chars)
 *
 * @param privateKeyHex - the private key as hex string
 * @returns true if valid, false otherwise
 */
export function isValidRawPrivateKey(privateKeyHex: string): boolean {
  if (!privateKeyHex || typeof privateKeyHex !== 'string') {
    return false;
  }

  // Must be 64 hex characters (32 bytes)
  if (!/^[a-fA-F0-9]{64}$/.test(privateKeyHex)) {
    return false;
  }

  return true;
}

/**
 * Format an amount as an XPR asset string
 *
 * @param amount - amount in base units (smallest unit)
 * @returns formatted asset string e.g. "1.0000 XPR"
 */
export function formatXprAmount(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = (numAmount / Math.pow(10, XPR_PRECISION)).toFixed(XPR_PRECISION);
  return `${formatted} ${XPR_SYMBOL}`;
}

/**
 * Parse an XPR asset string to base units
 *
 * @param assetString - asset string e.g. "1.0000 XPR"
 * @returns amount in base units as string
 */
export function parseXprAmount(assetString: string): string {
  try {
    const asset = Asset.from(assetString);
    return (asset.value * Math.pow(10, asset.symbol.precision)).toString();
  } catch {
    throw new Error(`Invalid asset string: ${assetString}`);
  }
}

/**
 * Validate a raw transaction string (hex encoded)
 *
 * @param rawTransaction - the raw transaction hex string
 * @returns true if it appears to be valid hex, false otherwise
 */
export function isValidRawTransaction(rawTransaction: string): boolean {
  if (!rawTransaction || typeof rawTransaction !== 'string') {
    return false;
  }

  // Must be valid hex
  return /^[a-fA-F0-9]+$/.test(rawTransaction);
}

const utils = {
  isValidAddress,
  isValidPublicKey,
  isValidPrivateKey,
  isValidRawPrivateKey,
  formatXprAmount,
  parseXprAmount,
  isValidRawTransaction,
};

export default utils;
