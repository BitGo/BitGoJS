import * as bs58check from 'bs58check';
import { bech32, bech32m } from 'bech32';

/**
 * sBTC address version bytes as defined by the sBTC withdrawal contract.
 */
export enum SbtcAddressVersion {
  P2PKH = 0x00,
  P2SH = 0x01,
  P2WPKH = 0x04,
  P2WSH = 0x05,
  P2TR = 0x06,
}

interface DecodedBtcAddress {
  version: SbtcAddressVersion;
  hashBytes: Buffer;
}

const BASE58_MAINNET_P2PKH = 0x00;
const BASE58_MAINNET_P2SH = 0x05;
const BASE58_TESTNET_P2PKH = 0x6f;
const BASE58_TESTNET_P2SH = 0xc4;

/**
 * Decode a Bitcoin address into an sBTC version byte and hash bytes.
 *
 * @param {string} address - A Bitcoin address (P2PKH, P2SH, P2WPKH, P2WSH, or P2TR)
 * @returns {DecodedBtcAddress} The sBTC version and raw hash bytes
 */
export function decodeBtcAddress(address: string): DecodedBtcAddress {
  // Try base58check first (P2PKH / P2SH)
  try {
    const decoded = bs58check.decode(address);
    const versionByte = decoded[0];
    const hash = decoded.slice(1);

    if (hash.length !== 20) {
      throw new Error(`Invalid base58check hash length: ${hash.length}`);
    }

    switch (versionByte) {
      case BASE58_MAINNET_P2PKH:
      case BASE58_TESTNET_P2PKH:
        return { version: SbtcAddressVersion.P2PKH, hashBytes: Buffer.from(hash) };
      case BASE58_MAINNET_P2SH:
      case BASE58_TESTNET_P2SH:
        return { version: SbtcAddressVersion.P2SH, hashBytes: Buffer.from(hash) };
      default:
        throw new Error(`Unknown base58check version byte: 0x${versionByte.toString(16)}`);
    }
  } catch (e) {
    // Not base58check, try bech32/bech32m below
  }

  // Try bech32 (P2WPKH / P2WSH) and bech32m (P2TR)
  let decoded: { prefix: string; words: number[] };
  let isBech32m = false;

  try {
    decoded = bech32.decode(address);
  } catch {
    try {
      decoded = bech32m.decode(address);
      isBech32m = true;
    } catch {
      throw new Error(`Unable to decode Bitcoin address: ${address}`);
    }
  }

  const witnessVersion = decoded.words[0];
  const data = Buffer.from(bech32.fromWords(decoded.words.slice(1)));

  if (witnessVersion === 0 && !isBech32m) {
    if (data.length === 20) {
      return { version: SbtcAddressVersion.P2WPKH, hashBytes: data };
    } else if (data.length === 32) {
      return { version: SbtcAddressVersion.P2WSH, hashBytes: data };
    }
    throw new Error(`Invalid witness v0 program length: ${data.length}`);
  }

  if (witnessVersion === 1 && isBech32m) {
    if (data.length === 32) {
      return { version: SbtcAddressVersion.P2TR, hashBytes: data };
    }
    throw new Error(`Invalid witness v1 program length: ${data.length}`);
  }

  throw new Error(`Unsupported witness version ${witnessVersion} for address: ${address}`);
}

/**
 * Check whether a string is a valid Bitcoin address decodable for sBTC withdrawals.
 *
 * @param {string} address - The address to validate
 * @returns {boolean} true if the address can be decoded
 */
export function isValidBtcAddress(address: string): boolean {
  try {
    decodeBtcAddress(address);
    return true;
  } catch {
    return false;
  }
}
