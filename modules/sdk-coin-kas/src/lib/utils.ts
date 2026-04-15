/**
 * Kaspa (KAS) Utility Functions
 *
 * Address validation, encoding, script generation, and other utilities.
 * Kaspa uses cashaddr-style encoding (hrp:data) with x-only secp256k1 public keys.
 */

import { BaseUtils } from '@bitgo/sdk-core';
import {
  MAINNET_HRP,
  TESTNET_HRP,
  SIMNET_HRP,
  DEVNET_HRP,
  ADDRESS_VERSION_PUBKEY,
  ADDRESS_VERSION_SCRIPTHASH,
  OP_DATA_32,
  OP_CHECKSIG,
  OP_BLAKE2B,
  OP_EQUAL,
  X_ONLY_PUBLIC_KEY_SIZE,
  COMPRESSED_PUBLIC_KEY_SIZE,
} from './constants';
import { KaspaScriptPublicKey } from './iface';

const VALID_HRPS = new Set([MAINNET_HRP, TESTNET_HRP, SIMNET_HRP, DEVNET_HRP]);

// ─── Kaspa CashAddr Encoding ──────────────────────────────────────────────────
// Kaspa uses cashaddr-style addresses with ':' separator (not standard bech32/bech32m)
// Reference: https://github.com/kaspanet/kaspad/blob/master/domain/util/address

const KASPA_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const KASPA_CHARSET_MAP = new Map<string, number>(KASPA_CHARSET.split('').map((c, i) => [c, i]));
const KASPA_GENERATOR = [0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n, 0xae2eabe2a8n, 0x1e4f43e470n];

function kaspaPolymod(data: number[]): bigint {
  let c = 1n;
  for (const d of data) {
    const c0 = c >> 35n;
    c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(d);
    for (let i = 0; i < 5; i++) {
      if ((c0 >> BigInt(i)) & 1n) {
        c ^= KASPA_GENERATOR[i];
      }
    }
  }
  return c ^ 1n;
}

function kaspaExpandPrefix(prefix: string): number[] {
  const result: number[] = [];
  for (const c of prefix) {
    result.push(c.charCodeAt(0) & 0x1f);
  }
  result.push(0);
  return result;
}

function kaspaConvertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = BigInt(0);
  let bits = 0;
  const result: number[] = [];
  const maxv = BigInt((1 << toBits) - 1);
  for (const value of data) {
    acc = (acc << BigInt(fromBits)) | BigInt(value);
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push(Number((acc >> BigInt(bits)) & maxv));
    }
  }
  if (pad && bits > 0) {
    result.push(Number((acc << BigInt(toBits - bits)) & maxv));
  }
  return result;
}

function kaspaCreateChecksum(prefix: string, data: number[]): number[] {
  const enc = [...kaspaExpandPrefix(prefix), ...data, 0, 0, 0, 0, 0, 0, 0, 0];
  const mod = kaspaPolymod(enc);
  const result: number[] = [];
  for (let i = 0; i < 8; i++) {
    result.push(Number((mod >> (5n * BigInt(7 - i))) & 31n));
  }
  return result;
}

function kaspaVerifyChecksum(prefix: string, payload: number[]): boolean {
  return kaspaPolymod([...kaspaExpandPrefix(prefix), ...payload]) === 0n;
}

/**
 * Encode a Kaspa address in cashaddr format: `<hrp>:<base32data>`
 */
export function kaspaEncodeAddress(hrp: string, version: number, payload: Buffer): string {
  const data = kaspaConvertBits([version, ...payload], 8, 5, true);
  const checksum = kaspaCreateChecksum(hrp, data);
  const encoded = [...data, ...checksum].map((d) => KASPA_CHARSET[d]).join('');
  return `${hrp}:${encoded}`;
}

/**
 * Decode a Kaspa cashaddr address.
 */
export function kaspaDecodeAddress(address: string): { prefix: string; version: number; payload: Buffer } {
  const colonIdx = address.indexOf(':');
  if (colonIdx < 0) throw new Error('Missing colon separator in Kaspa address');
  const hrp = address.slice(0, colonIdx);
  const dataStr = address.slice(colonIdx + 1);

  const words: number[] = [];
  for (const c of dataStr) {
    const val = KASPA_CHARSET_MAP.get(c);
    if (val === undefined) throw new Error(`Invalid character in Kaspa address: ${c}`);
    words.push(val);
  }

  if (!kaspaVerifyChecksum(hrp, words)) {
    throw new Error('Invalid Kaspa address checksum');
  }

  const dataWithoutChecksum = words.slice(0, -8);
  const decoded = kaspaConvertBits(dataWithoutChecksum, 5, 8, false);
  // Validate that leftover padding bits are zero (non-canonical encodings rejected)
  const bitCount = dataWithoutChecksum.length * 5;
  const byteCount = Math.floor(bitCount / 8);
  if (decoded.length !== byteCount) {
    throw new Error('Invalid Kaspa address: non-canonical padding');
  }
  const version = decoded[0];
  const payload = Buffer.from(decoded.slice(1));

  return { prefix: hrp, version, payload };
}

export class Utils implements BaseUtils {
  /**
   * Validate a Kaspa address (cashaddr-encoded)
   */
  isValidAddress(address: string): boolean {
    return isValidAddress(address);
  }

  /**
   * Validate a Kaspa transaction hex
   */
  isValidTransactionId(txId: string): boolean {
    return /^[0-9a-fA-F]{64}$/.test(txId);
  }

  /**
   * Validate a signature (Schnorr = 64 bytes)
   */
  isValidSignature(signature: string): boolean {
    return /^[0-9a-fA-F]{128}$/.test(signature);
  }

  /**
   * Validate a block hash
   */
  isValidBlockId(blockId: string): boolean {
    return /^[0-9a-fA-F]{64}$/.test(blockId);
  }

  /**
   * Validate a secp256k1 public key
   */
  isValidPublicKey(pub: string): boolean {
    return isValidPublicKey(pub);
  }

  /**
   * Validate a secp256k1 private key
   */
  isValidPrivateKey(prv: string): boolean {
    return isValidPrivateKey(prv);
  }
}

/**
 * Validate a Kaspa address.
 * Must be cashaddr-encoded (hrp:...) with one of the known Kaspa HRPs.
 */
export function isValidAddress(address: string | string[]): boolean {
  if (Array.isArray(address)) {
    return address.every((a) => isValidAddress(a));
  }
  if (typeof address !== 'string' || !address) return false;
  try {
    const { prefix, version, payload } = kaspaDecodeAddress(address);
    if (!VALID_HRPS.has(prefix)) return false;
    if (version !== ADDRESS_VERSION_PUBKEY && version !== ADDRESS_VERSION_SCRIPTHASH) return false;
    // P2PK: 32-byte x-only public key
    // P2SH: 32-byte script hash
    return payload.length === X_ONLY_PUBLIC_KEY_SIZE;
  } catch {
    return false;
  }
}

/**
 * Validate a secp256k1 public key (compressed 33-byte hex).
 */
export function isValidPublicKey(pub: string): boolean {
  if (typeof pub !== 'string') return false;
  if (!/^[0-9a-fA-F]+$/.test(pub)) return false;
  if (pub.length === COMPRESSED_PUBLIC_KEY_SIZE * 2) {
    // Compressed: must start with 02 or 03
    return pub.startsWith('02') || pub.startsWith('03');
  }
  if (pub.length === X_ONLY_PUBLIC_KEY_SIZE * 2) {
    // x-only 32-byte key
    return true;
  }
  return false;
}

/**
 * Validate a 32-byte hex private key.
 */
export function isValidPrivateKey(prv: string): boolean {
  return typeof prv === 'string' && /^[0-9a-fA-F]{64}$/.test(prv);
}

/**
 * Derive a Kaspa address from a compressed secp256k1 public key.
 *
 * Kaspa P2PK address format:
 *   kaspaEncodeAddress(hrp, version=0x00, x_only_pubkey_32bytes)
 */
export function publicKeyToAddress(compressedPubKey: Buffer, hrp: string = MAINNET_HRP): string {
  if (compressedPubKey.length !== COMPRESSED_PUBLIC_KEY_SIZE) {
    throw new Error(`Expected 33-byte compressed public key, got ${compressedPubKey.length} bytes`);
  }
  // Extract x-only public key (skip the 0x02/0x03 prefix byte)
  const xOnlyPubKey = compressedPubKey.slice(1);
  return kaspaEncodeAddress(hrp, ADDRESS_VERSION_PUBKEY, xOnlyPubKey);
}

/**
 * Build a P2PK script public key from an x-only public key.
 *
 * Script: OP_DATA_32 (0x20) + x_only_pubkey (32 bytes) + OP_CHECKSIG (0xAC)
 */
export function buildScriptPublicKey(xOnlyPubKey: Buffer): KaspaScriptPublicKey {
  if (xOnlyPubKey.length !== X_ONLY_PUBLIC_KEY_SIZE) {
    throw new Error(`Expected 32-byte x-only public key, got ${xOnlyPubKey.length} bytes`);
  }
  const script = Buffer.concat([Buffer.from([OP_DATA_32]), xOnlyPubKey, Buffer.from([OP_CHECKSIG])]);
  return {
    version: 0,
    script: script.toString('hex'),
  };
}

/**
 * Build a P2SH script public key from a 32-byte script hash.
 *
 * Script: OP_BLAKE2B (0xAA) + OP_DATA_32 (0x20) + script_hash (32 bytes) + OP_EQUAL (0x87)
 */
export function buildP2SHScriptPublicKey(scriptHash: Buffer): KaspaScriptPublicKey {
  if (scriptHash.length !== X_ONLY_PUBLIC_KEY_SIZE) {
    throw new Error(`Expected 32-byte script hash, got ${scriptHash.length} bytes`);
  }
  const script = Buffer.concat([Buffer.from([OP_BLAKE2B, OP_DATA_32]), scriptHash, Buffer.from([OP_EQUAL])]);
  return {
    version: 0,
    script: script.toString('hex'),
  };
}

/**
 * Extract the HRP from a Kaspa address.
 */
export function getHrpFromAddress(address: string): string {
  const colonIdx = address.indexOf(':');
  if (colonIdx < 0) throw new Error('Not a valid Kaspa address');
  return address.slice(0, colonIdx);
}

/**
 * Determine if an address is mainnet or testnet.
 */
export function isMainnetAddress(address: string): boolean {
  try {
    return getHrpFromAddress(address) === MAINNET_HRP;
  } catch {
    return false;
  }
}

/**
 * Convert a bigint to an 8-byte little-endian buffer.
 */
export function uint64ToLE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value);
  return buf;
}

/**
 * Convert a number to a 4-byte little-endian buffer.
 */
export function uint32ToLE(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return buf;
}

/**
 * Convert a number to a 2-byte little-endian buffer.
 */
export function uint16ToLE(value: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value);
  return buf;
}

/**
 * Write a variable-length integer (varint) as used in Kaspa serialization.
 * Kaspa uses the same varint encoding as Bitcoin.
 */
export function writeVarInt(value: number | bigint): Buffer {
  const n = typeof value === 'bigint' ? value : BigInt(value);
  if (n < BigInt(0xfd)) {
    return Buffer.from([Number(n)]);
  } else if (n <= BigInt(0xffff)) {
    const buf = Buffer.alloc(3);
    buf[0] = 0xfd;
    buf.writeUInt16LE(Number(n), 1);
    return buf;
  } else if (n <= BigInt(0xffffffff)) {
    const buf = Buffer.alloc(5);
    buf[0] = 0xfe;
    buf.writeUInt32LE(Number(n), 1);
    return buf;
  } else {
    const buf = Buffer.alloc(9);
    buf[0] = 0xff;
    buf.writeBigUInt64LE(n, 1);
    return buf;
  }
}

/**
 * Serialize a transaction ID as raw bytes (no byte-order reversal).
 * Unlike Bitcoin, Kaspa uses the natural byte order of the transaction ID.
 */
export function serializeTxId(txId: string): Buffer {
  return Buffer.from(txId, 'hex');
}

const utilsInstance = new Utils();
export default utilsInstance;
