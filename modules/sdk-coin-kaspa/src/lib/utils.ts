import { BaseUtils, isValidXprv, isValidXpub } from '@bitgo/sdk-core';
import { MAINNET_PREFIX, TESTNET_PREFIX } from './constants';

// Kaspa address encoding uses a bech32-like scheme with ':' as separator
// and a custom checksum polynomial (same as Bitcoin Cash cashaddr).

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const CHARSET_REVERSE: Record<string, number> = {};
for (let i = 0; i < CHARSET.length; i++) {
  CHARSET_REVERSE[CHARSET[i]] = i;
}

const GENERATOR = [
  BigInt('0x98f2bc8e61'),
  BigInt('0x79b76d99e2'),
  BigInt('0xf33e5fb3c4'),
  BigInt('0xae2eabe2a8'),
  BigInt('0x1e4f43e470'),
];

function polymod(values: number[]): bigint {
  let c = 1n;
  for (const d of values) {
    const c0 = c >> 35n;
    c = ((c & BigInt('0x07ffffffff')) << 5n) ^ BigInt(d);
    for (let i = 0; i < 5; i++) {
      if ((c0 >> BigInt(i)) & 1n) {
        c ^= GENERATOR[i];
      }
    }
  }
  return c ^ 1n;
}

function prefixExpand(prefix: string): number[] {
  return [...prefix].map((c) => c.charCodeAt(0) & 0x1f).concat([0]);
}

function createChecksum(prefix: string, data: number[]): number[] {
  const values = prefixExpand(prefix).concat(data).concat([0, 0, 0, 0, 0, 0, 0, 0]);
  const mod = polymod(values);
  const ret: number[] = [];
  for (let i = 7; i >= 0; i--) {
    ret.push(Number((mod >> BigInt(5 * i)) & 31n));
  }
  return ret;
}

function verifyChecksum(prefix: string, data: number[]): boolean {
  const values = prefixExpand(prefix).concat(data);
  return polymod(values) === 0n;
}

function convertBits(data: Buffer | Uint8Array, from: number, to: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << to) - 1;
  for (const value of data) {
    acc = (acc << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad && bits > 0) {
    ret.push((acc << (to - bits)) & maxv);
  }
  return ret;
}

/**
 * Encode data into a Kaspa bech32-like address.
 */
function kaspaEncode(prefix: string, data: number[]): string {
  const checksum = createChecksum(prefix, data);
  return (
    prefix +
    ':' +
    data
      .concat(checksum)
      .map((d) => CHARSET[d])
      .join('')
  );
}

/**
 * Decode a Kaspa bech32-like address.
 * Returns { prefix, data } or throws on error.
 */
function kaspacDecode(address: string): { prefix: string; data: number[] } {
  const colonIdx = address.lastIndexOf(':');
  if (colonIdx < 1) {
    throw new Error('Missing prefix separator');
  }
  const prefix = address.slice(0, colonIdx).toLowerCase();
  const encoded = address.slice(colonIdx + 1).toLowerCase();

  const data: number[] = [];
  for (const c of encoded) {
    const val = CHARSET_REVERSE[c];
    if (val === undefined) {
      throw new Error(`Invalid character: ${c}`);
    }
    data.push(val);
  }

  if (!verifyChecksum(prefix, data)) {
    throw new Error('Invalid checksum');
  }

  return { prefix, data: data.slice(0, -8) };
}

/**
 * Validates a Kaspa address (mainnet or testnet)
 */
export function isValidKaspaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const colonIdx = address.lastIndexOf(':');
  if (colonIdx < 1) {
    return false;
  }

  const prefix = address.slice(0, colonIdx).toLowerCase();
  if (prefix !== MAINNET_PREFIX && prefix !== TESTNET_PREFIX) {
    return false;
  }

  try {
    const decoded = kaspacDecode(address);
    return decoded.data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validates a Kaspa mainnet address
 */
export function isValidMainnetAddress(address: string): boolean {
  return isValidKaspaAddress(address) && address.toLowerCase().startsWith(MAINNET_PREFIX + ':');
}

/**
 * Validates a Kaspa testnet address
 */
export function isValidTestnetAddress(address: string): boolean {
  return isValidKaspaAddress(address) && address.toLowerCase().startsWith(TESTNET_PREFIX + ':');
}

/**
 * Derive a Kaspa P2PK (Schnorr) address from a compressed secp256k1 public key.
 *
 * @param compressedPubKey - 33-byte compressed secp256k1 public key (hex string or Buffer)
 * @param hrp - human-readable part ('kaspa' or 'kaspatest')
 */
export function pubKeyToKaspaAddress(compressedPubKey: string | Buffer, hrp: string): string {
  const pubKeyBytes = Buffer.isBuffer(compressedPubKey)
    ? compressedPubKey
    : Buffer.from(compressedPubKey as string, 'hex');

  if (pubKeyBytes.length !== 33) {
    throw new Error(`Expected 33-byte compressed public key, got ${pubKeyBytes.length}`);
  }

  // X-only public key: drop the prefix byte (02 or 03), keep 32-byte x-coordinate
  const xOnlyPubKey = pubKeyBytes.slice(1);

  // Kaspa P2PK address:
  // - version nibble: 0 (Schnorr secp256k1 P2PK)
  // - payload: x-only public key (32 bytes)
  const versionByte = 0;
  const payload = Buffer.concat([Buffer.from([versionByte]), xOnlyPubKey]);
  const words = convertBits(payload, 8, 5, true);

  return kaspaEncode(hrp, words);
}

/**
 * Validates a secp256k1 public key (compressed or uncompressed)
 */
export function isValidPublicKey(pub: string): boolean {
  if (!pub || typeof pub !== 'string') {
    return false;
  }
  try {
    const buf = Buffer.from(pub, 'hex');
    if (buf.length === 33) {
      return buf[0] === 0x02 || buf[0] === 0x03;
    }
    if (buf.length === 65) {
      return buf[0] === 0x04;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Validates a secp256k1 private key (32-byte hex)
 */
export function isValidPrivateKey(prv: string): boolean {
  if (!prv || typeof prv !== 'string') {
    return false;
  }
  if (isValidXprv(prv) || isValidXpub(prv)) {
    return true;
  }
  try {
    const buf = Buffer.from(prv.slice(0, 64), 'hex');
    return buf.length === 32;
  } catch {
    return false;
  }
}

/**
 * Validates a transaction ID (64-char hex)
 */
export function isValidTransactionId(txId: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(txId);
}

export class Utils implements BaseUtils {
  isValidAddress(address: string): boolean {
    return isValidKaspaAddress(address);
  }

  isValidBlockId(hash: string): boolean {
    return /^[0-9a-fA-F]{64}$/.test(hash);
  }

  isValidPrivateKey(key: string): boolean {
    return isValidPrivateKey(key);
  }

  isValidPublicKey(key: string): boolean {
    return isValidPublicKey(key);
  }

  isValidSignature(signature: string): boolean {
    return /^[0-9a-fA-F]{128,130}$/.test(signature);
  }

  isValidTransactionId(txId: string): boolean {
    return isValidTransactionId(txId);
  }
}

const utils = new Utils();
export default utils;
