/**
 * @prettier
 *
 * @experimental Encode/decode helpers for the *derivable* form of a safe slot-④
 * (`ed25519Multisig`) root public key.
 *
 * Wallet Safes v1 soft-derives the backup and BitGo co-signer keys of every minted wallet from the
 * safe's root public keys, and soft derivation needs a chain code. The secp256k1 slot gets one for
 * free (a BIP32 xpub is `point || chaincode`); a bare Stellar StrKey `G…` has nowhere to put one.
 * Per TDD Part II-3 §1.3 we therefore concatenate the chain code onto `pub` rather than introduce a
 * new field — the same shape BitGo already uses for the MPC slots, whose `commonKeychain` is
 * `pub || chaincode`.
 *
 *   pub = <StrKey ed25519 public key> || <chainCode, 64 lowercase hex>
 *          exactly 56 chars, 'G…'         exactly 64 chars
 *   total length exactly 120
 *
 * StrKey ed25519 public keys are always exactly 56 characters, so the split is a fixed offset. That
 * offset is a CROSS-REPO contract shared with wallet-platform, `modules/key-card` and WRW; four
 * independent implementations drifting produces unrecoverable wallets. Every call site — here and in
 * the other repos — MUST go through these helpers rather than slicing inline.
 */

/**
 * The fixed character offset at which a composite slot-④ pub splits into (StrKey pub, chain code).
 * Stellar StrKey ed25519 public keys are a fixed 56 characters, so no length prefix or separator is
 * needed.
 *
 * MUST stay identical to the corresponding constant in wallet-platform, `modules/key-card` and WRW:
 * a divergent offset splits the pub in the wrong place and derives co-signer keys nobody else can
 * reproduce, permanently bricking the wallets minted with it.
 */
export const DERIVABLE_ED25519_PUB_SPLIT_OFFSET = 56;

/** Length of the hex-encoded chain code half (32 bytes). */
export const DERIVABLE_ED25519_CHAIN_CODE_LENGTH = 64;

/** Total length of a well-formed composite pub. */
export const DERIVABLE_ED25519_PUB_LENGTH = DERIVABLE_ED25519_PUB_SPLIT_OFFSET + DERIVABLE_ED25519_CHAIN_CODE_LENGTH;

/**
 * Chain codes are serialized as LOWERCASE hex only. Uppercase and mixed-case are rejected rather
 * than normalized: accepting both casings would make the composite pub non-canonical, so the same
 * key could be stored under two distinct strings and equality against a previously-persisted pub
 * would spuriously fail.
 */
const CHAIN_CODE_REGEX = /^[0-9a-f]{64}$/;

/** StrKey version byte for an ed25519 public key (`G…`). */
const STRKEY_VERSION_BYTE_ED25519_PUBLIC_KEY = 6 << 3;

/** Decoded StrKey payload: 1 version byte + 32-byte key + 2-byte checksum. */
const STRKEY_DECODED_LENGTH = 35;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STRKEY_ED25519_PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;

/**
 * Decode an unpadded RFC 4648 base32 string. The caller guarantees the input matched
 * {@link STRKEY_ED25519_PUBLIC_KEY_REGEX}, so 56 chars × 5 bits = 280 bits = exactly 35 bytes with
 * no leftover bits — the encoding is unambiguously canonical.
 */
function base32Decode(input: string): Buffer {
  const out = Buffer.alloc((input.length * 5) / 8);
  let bits = 0;
  let value = 0;
  let index = 0;
  for (const char of input) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (value >>> bits) & 0xff;
    }
  }
  return out;
}

/** CRC16-XModem, the checksum Stellar StrKey appends (little-endian) to the versioned payload. */
function crc16Xmodem(data: Buffer): number {
  let crc = 0x0000;
  for (const byte of data) {
    let code = (crc >>> 8) & 0xff;
    code ^= byte;
    code ^= code >>> 4;
    crc = ((crc << 8) & 0xffff) ^ ((code << 12) & 0xffff) ^ ((code << 5) & 0xffff) ^ code;
  }
  return crc & 0xffff;
}

/**
 * Returns true iff `pub` is a valid Stellar StrKey ed25519 public key.
 *
 * Implemented here rather than pulled from `stellar-sdk` because `sdk-core` must not depend on a
 * coin module. The pub half is validated by CHECKSUM, not merely by length and alphabet — a
 * 56-character `G…` string with a corrupted body is rejected.
 */
export function isValidEd25519StrKeyPublicKey(pub: string): boolean {
  if (!STRKEY_ED25519_PUBLIC_KEY_REGEX.test(pub)) {
    return false;
  }
  const decoded = base32Decode(pub);
  if (decoded.length !== STRKEY_DECODED_LENGTH || decoded[0] !== STRKEY_VERSION_BYTE_ED25519_PUBLIC_KEY) {
    return false;
  }
  return (
    crc16Xmodem(decoded.subarray(0, STRKEY_DECODED_LENGTH - 2)) === decoded.readUInt16LE(STRKEY_DECODED_LENGTH - 2)
  );
}

/** Returns true iff `chainCode` is exactly 64 lowercase hex characters. */
export function isValidEd25519ChainCode(chainCode: string): boolean {
  return CHAIN_CODE_REGEX.test(chainCode);
}

/**
 * Compose a derivable slot-④ root pub from its two halves.
 *
 * Throws when either half is malformed: silently emitting a composite whose halves do not round-trip
 * would persist a root pub from which no correct co-signer key can ever be derived.
 */
export function encodeDerivableEd25519Pub(pub: string, chainCode: string): string {
  if (!isValidEd25519StrKeyPublicKey(pub)) {
    throw new Error('Invalid derivable ed25519 pub: pub half is not a valid ed25519 public key');
  }
  if (!isValidEd25519ChainCode(chainCode)) {
    throw new Error('Invalid derivable ed25519 pub: chainCode must be 64 lowercase hex characters');
  }
  return `${pub}${chainCode}`;
}

/**
 * Split a composite slot-④ root pub back into its two halves.
 *
 * Throws unless the input is EXACTLY the composite form. A lenient decode that accepted a bare
 * 56-character pub would hand callers an empty chain code and derive every co-signer from the same
 * (zero-length) entropy.
 */
export function decodeDerivableEd25519Pub(composite: string): { pub: string; chainCode: string } {
  if (composite.length !== DERIVABLE_ED25519_PUB_LENGTH) {
    throw new Error(
      `Invalid derivable ed25519 pub: expected ${DERIVABLE_ED25519_PUB_LENGTH} characters, got ${composite.length}`
    );
  }
  const pub = composite.slice(0, DERIVABLE_ED25519_PUB_SPLIT_OFFSET);
  const chainCode = composite.slice(DERIVABLE_ED25519_PUB_SPLIT_OFFSET);
  if (!isValidEd25519StrKeyPublicKey(pub)) {
    throw new Error('Invalid derivable ed25519 pub: pub half is not a valid ed25519 public key');
  }
  if (!isValidEd25519ChainCode(chainCode)) {
    throw new Error('Invalid derivable ed25519 pub: chainCode must be 64 lowercase hex characters');
  }
  return { pub, chainCode };
}

/** Returns true iff `composite` is a well-formed derivable slot-④ root pub. */
export function isDerivableEd25519Pub(composite: string): boolean {
  try {
    decodeDerivableEd25519Pub(composite);
    return true;
  } catch {
    return false;
  }
}
