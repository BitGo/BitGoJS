/**
 * @prettier
 *
 * Ed25519 safe-root public derivation material and Stellar user-key codecs.
 *
 * Safe backup and BitGo roots store raw public key (32 bytes) || raw chain code (32 bytes),
 * encoded together as canonical unpadded RFC 4648 base32. Coin-specific public-key encodings are
 * applied only to derived wallet children.
 *
 * The WASM soft-derivation (`softDeriveChildPubEd25519`) stays in sdk-core's
 * bitgo/safe/derivableEd25519Pub — it needs Ed25519BIP32/Eddsa and is not part of this leaf.
 */

import { randomBytes } from 'crypto';

export const DERIVABLE_ED25519_PUBLIC_KEY_BYTES = 32;
export const DERIVABLE_ED25519_CHAIN_CODE_BYTES = 32;
export const DERIVABLE_ED25519_PUB_LENGTH = 103;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32_ROOT_REGEX = /^[A-Z2-7]{103}$/;
const STRKEY_PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;
const STRKEY_SECRET_SEED_REGEX = /^S[A-Z2-7]{55}$/;
const STRKEY_VERSION_PUBLIC_KEY = 6 << 3;
const STRKEY_VERSION_SECRET_SEED = 18 << 3;
const STRKEY_DECODED_BYTES = 35;

function base32Decode(input: string): Buffer {
  const output = Buffer.alloc(Math.floor((input.length * 5) / 8));
  let bits = 0;
  let value = 0;
  let offset = 0;
  for (const char of input) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output[offset++] = (value >>> bits) & 0xff;
    }
  }
  return output;
}

function base32Encode(data: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += BASE32_ALPHABET[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function crc16Xmodem(data: Buffer): number {
  let crc = 0;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

function decodeStrKey(value: string, version: number, label: string): Buffer {
  const decoded = base32Decode(value);
  if (
    decoded.length !== STRKEY_DECODED_BYTES ||
    decoded[0] !== version ||
    base32Encode(decoded) !== value ||
    crc16Xmodem(decoded.subarray(0, STRKEY_DECODED_BYTES - 2)) !== decoded.readUInt16LE(STRKEY_DECODED_BYTES - 2)
  ) {
    throw new Error(`Invalid ed25519 StrKey ${label}`);
  }
  return decoded.subarray(1, 33);
}

/** Returns true for canonical base32-encoded 64-byte public derivation material. */
export function isDerivableEd25519Pub(pub: string): boolean {
  return BASE32_ROOT_REGEX.test(pub) && base32Encode(base32Decode(pub)) === pub;
}

/** Throws unless the value is canonical base32-encoded 64-byte root material. */
export function assertDerivableEd25519Pub(pub: string): void {
  if (!isDerivableEd25519Pub(pub)) {
    throw new Error('Invalid derivable ed25519 pub: expected 64 bytes of canonical base32');
  }
}

/** Compose raw public-key and chain-code bytes into one base32 root value. */
export function encodeDerivableEd25519Pub(pub: Buffer, chainCode: Buffer): string {
  if (pub.length !== DERIVABLE_ED25519_PUBLIC_KEY_BYTES || chainCode.length !== DERIVABLE_ED25519_CHAIN_CODE_BYTES) {
    throw new Error('Invalid derivable ed25519 pub: expected 32-byte public key and chain code buffers');
  }
  return base32Encode(Buffer.concat([pub, chainCode]));
}

/** Decode a base32 root into raw public-key and chain-code buffers. */
export function decodeDerivableEd25519Pub(composite: string): { pub: Buffer; chainCode: Buffer } {
  assertDerivableEd25519Pub(composite);
  const decoded = base32Decode(composite);
  return {
    pub: decoded.subarray(0, DERIVABLE_ED25519_PUBLIC_KEY_BYTES),
    chainCode: decoded.subarray(DERIVABLE_ED25519_PUBLIC_KEY_BYTES),
  };
}

/** Generate a fresh raw 32-byte chain code for root composition. */
export function generateEd25519ChainCode(): Buffer {
  return randomBytes(DERIVABLE_ED25519_CHAIN_CODE_BYTES);
}

export function decodeEd25519StrKeyPublicKey(pub: string): Buffer {
  if (!STRKEY_PUBLIC_KEY_REGEX.test(pub)) {
    throw new Error('Invalid ed25519 StrKey public key');
  }
  return decodeStrKey(pub, STRKEY_VERSION_PUBLIC_KEY, 'public key');
}

export function isValidEd25519StrKeyPublicKey(pub: string): boolean {
  try {
    decodeEd25519StrKeyPublicKey(pub);
    return true;
  } catch {
    return false;
  }
}

export function decodeEd25519StrKeySecretSeed(seed: string): Buffer {
  if (!STRKEY_SECRET_SEED_REGEX.test(seed)) {
    throw new Error('Invalid ed25519 StrKey secret seed');
  }
  return decodeStrKey(seed, STRKEY_VERSION_SECRET_SEED, 'secret seed');
}

export function encodeEd25519StrKeyPublicKey(rawPub: Buffer): string {
  if (rawPub.length !== DERIVABLE_ED25519_PUBLIC_KEY_BYTES) {
    throw new Error('ed25519 public key must be 32 bytes');
  }
  const payload = Buffer.concat([Buffer.from([STRKEY_VERSION_PUBLIC_KEY]), rawPub]);
  const checksum = Buffer.alloc(2);
  checksum.writeUInt16LE(crc16Xmodem(payload), 0);
  return base32Encode(Buffer.concat([payload, checksum]));
}

export function isChecksumValidStrKeyEd25519Pub(pub: string): boolean {
  try {
    decodeEd25519StrKeyPublicKey(pub);
    return true;
  } catch {
    return false;
  }
}
