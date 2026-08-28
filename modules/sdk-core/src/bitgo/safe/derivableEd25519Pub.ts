/**
 * The fixed-width encoding for derivable ed25519 safe root public keys.
 *
 * Stellar public keys are StrKeys: a 56-character base32 string containing a
 * version byte, 32-byte key, and CRC16-XModem checksum.
 */
const ED25519_PUB_LENGTH = 56;
const CHAIN_CODE_LENGTH = 64;
const COMPOSITE_LENGTH = ED25519_PUB_LENGTH + CHAIN_CODE_LENGTH;
const STELLAR_BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STELLAR_ED25519_PUB_VERSION = 0x30;

function decodeStellarPublicKey(pub: string): Uint8Array | undefined {
  if (pub.length !== ED25519_PUB_LENGTH || !pub.startsWith('G')) {
    return undefined;
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const character of pub) {
    const value = STELLAR_BASE32_ALPHABET.indexOf(character);
    if (value === -1) {
      return undefined;
    }
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  if (bits !== 0 || bytes.length !== 35 || (buffer & ((1 << bits) - 1)) !== 0) {
    return undefined;
  }

  const payload = bytes.slice(0, 33);
  const checksum = bytes[33] | (bytes[34] << 8);
  if (payload[0] !== STELLAR_ED25519_PUB_VERSION || crc16(payload) !== checksum) {
    return undefined;
  }
  return Uint8Array.from(payload.slice(1));
}

function crc16(bytes: number[]): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = ((crc << 1) ^ ((crc & 0x8000) === 0x8000 ? 0x1021 : 0)) & 0xffff;
    }
  }
  return crc;
}

function isLowercaseHex(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

/** Compose a derivable slot-④ root pub. Throws if either half is malformed. */
export function encodeDerivableEd25519Pub(pub: string, chainCode: string): string {
  if (decodeStellarPublicKey(pub) === undefined) {
    throw new Error(`Invalid ed25519 public key: ${pub}`);
  }
  if (!isLowercaseHex(chainCode)) {
    throw new Error(`Invalid chain code: ${chainCode}`);
  }
  return pub + chainCode;
}

/** Split a composite pub. Throws if the input is not exactly the composite form. */
export function decodeDerivableEd25519Pub(composite: string): { pub: string; chainCode: string } {
  if (composite.length !== COMPOSITE_LENGTH) {
    throw new Error('Invalid derivable ed25519 public key length');
  }
  const pub = composite.slice(0, ED25519_PUB_LENGTH);
  const chainCode = composite.slice(ED25519_PUB_LENGTH);
  if (decodeStellarPublicKey(pub) === undefined || !isLowercaseHex(chainCode)) {
    throw new Error('Invalid derivable ed25519 public key');
  }
  return { pub, chainCode };
}
