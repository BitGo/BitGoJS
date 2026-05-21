/**
 * Kaspa (KASPA) Constants
 *
 * References:
 * - https://kaspa.org/
 * - https://kaspa.aspectron.org/docs/
 * - rusty-kaspa/crypto/txscript/src/standard.rs
 * - rusty-kaspa/crypto/hashes/src/hashers.rs
 * - rusty-kaspa/consensus/core/src/hashing/sighash.rs
 */

// ── Network ───────────────────────────────────────────────────────────────────

export const MAINNET_PREFIX = 'kaspa';
export const TESTNET_PREFIX = 'kaspatest';

// ── Transaction ───────────────────────────────────────────────────────────────

/** Default transaction fee (minimum relay fee in sompi) */
export const DEFAULT_FEE = '1000'; // 0.00001 KASPA minimum

/** Kaspa transaction version */
export const TX_VERSION = 0;

// ── SigHash type flags ────────────────────────────────────────────────────────
//
// Defined in rusty-kaspa consensus/core/src/hashing/sighash_type.rs

export const SIGHASH_ALL = 0x01;
export const SIGHASH_NONE = 0x02;
export const SIGHASH_SINGLE = 0x04;
export const SIGHASH_ANYONECANPAY = 0x80;

// ── Script opcodes ────────────────────────────────────────────────────────────
//
// Verified against:
//   https://kaspa.aspectron.org/docs/enums/Opcodes.html
//   rusty-kaspa/crypto/txscript/src/standard.rs
//
// OpCheckSig      = 172 = 0xAC  → Schnorr P2PK (v0 address)
// OpCheckSigECDSA = 171 = 0xAB  → ECDSA P2PK  (v1 address)

/** Schnorr BIP-340 checksig opcode — used by v0 Kaspa addresses */
export const OP_CHECKSIG_SCHNORR = 0xac;

/** secp256k1 ECDSA checksig opcode — used by v1 Kaspa addresses */
export const OP_CHECKSIG_ECDSA = 0xab;

/** Script version for standard P2PK scripts */
export const SCRIPT_PUBLIC_KEY_VERSION = 0;

// ── Enums ─────────────────────────────────────────────────────────────────────

/**
 * Kaspa P2PK script type.
 * Determines the scriptPublicKey layout and the required signing algorithm.
 *
 * SCHNORR (v0): OP_DATA_32 (0x20) | xOnlyPubKey32 | OP_CHECKSIG_SCHNORR (0xAC)
 * ECDSA   (v1): OP_DATA_33 (0x21) | compressedPubKey33 | OP_CHECKSIG_ECDSA (0xAB)
 */
export enum KaspaScriptType {
  SCHNORR = 0, // v0 — Schnorr P2PK, x-only 32-byte pubkey
  ECDSA = 1, // v1 — ECDSA P2PK, compressed 33-byte pubkey
}

/**
 * Kaspa address version / type.
 * Mirrors KaspaScriptType — the version byte in the bech32 address payload
 * encodes which script type (and therefore which signature algorithm) applies.
 *
 * SCHNORR (v0): version byte 0x00, x-only 32-byte pubkey in address payload
 * ECDSA   (v1): version byte 0x01, compressed 33-byte pubkey in address payload
 */
export enum KaspaAddressType {
  SCHNORR = 0, // default — v0 Schnorr P2PK address
  ECDSA = 1, // v1 ECDSA P2PK address
}
