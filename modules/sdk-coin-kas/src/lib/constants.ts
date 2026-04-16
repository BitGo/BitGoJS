/**
 * Kaspa (KAS) Constants
 *
 * Kaspa is a UTXO-based BlockDAG using GHOSTDAG consensus (Proof-of-Work).
 * Uses Schnorr signatures over secp256k1 and cashaddr-style address encoding.
 */

// Native coin denomination
export const DECIMALS = 8;
export const BASE_FACTOR = Math.pow(10, DECIMALS); // 100,000,000 sompi per KAS

// Address format
export const MAINNET_HRP = 'kaspa';
export const TESTNET_HRP = 'kaspatest';
export const SIMNET_HRP = 'kaspasim';
export const DEVNET_HRP = 'kaspadev';

// Address version bytes
export const ADDRESS_VERSION_PUBKEY = 0x00; // P2PK (Schnorr)
export const ADDRESS_VERSION_SCRIPTHASH = 0x08; // P2SH

// Transaction structure
export const TX_VERSION = 0;
export const NATIVE_SUBNETWORK_ID = Buffer.alloc(20, 0); // 20 zero bytes for native transactions
export const COINBASE_SUBNETWORK_ID = Buffer.from('0100000000000000000000000000000000000000', 'hex');
export const DEFAULT_SEQUENCE = BigInt('0xFFFFFFFFFFFFFFFF');
export const DEFAULT_GAS = BigInt(0);
export const DEFAULT_LOCK_TIME = BigInt(0);

// Script opcodes
export const OP_DATA_32 = 0x20; // Push next 32 bytes
export const OP_CHECKSIG = 0xac; // Check Schnorr signature
export const OP_BLAKE2B = 0xaa; // Hash top of stack with BLAKE2B (used in P2SH)
export const OP_EQUAL = 0x87; // Check equality (used in P2SH)

// Fee (in sompi)
export const MIN_RELAY_FEE_PER_MASS = BigInt(1000); // 1000 sompi per gram-unit of mass
export const MINIMUM_FEE = BigInt(1000); // Minimum 1000 sompi fee

// Mass calculation constants (Kaspa uses "mass" not gas)
export const HASH_SIZE = 32;
export const BLANK_TRANSACTION_MASS = 10;
export const TRANSACTION_MASS_PER_INPUT = 100;
export const TRANSACTION_MASS_PER_OUTPUT = 50;

// Sighash types
export const SIGHASH_ALL = 0x01;

// Public key sizes (secp256k1)
export const COMPRESSED_PUBLIC_KEY_SIZE = 33; // 0x02/0x03 + 32 bytes
export const X_ONLY_PUBLIC_KEY_SIZE = 32; // Just the x-coordinate
export const PRIVATE_KEY_SIZE = 32;

// Signature size (Schnorr)
export const SCHNORR_SIGNATURE_SIZE = 64;

// BLAKE2B domain tags for Kaspa sighash
export const SIGHASH_DOMAIN_TAG = 'TransactionSigningHash';
export const SIGHASH_ECDSA_DOMAIN_TAG = 'TransactionSigningHashECDSA';
