/**
 * Kaspa (KASPA) Constants
 *
 * References:
 * - https://kaspa.org/
 * - https://kaspa.aspectron.org/docs/
 */

// Address format
export const MAINNET_PREFIX = 'kaspa';
export const TESTNET_PREFIX = 'kaspatest';

// Kaspa address version bytes (encoded as 5-bit value in bech32)
export const VERSION_PUBKEY = 0; // Schnorr P2PK (secp256k1 x-only pubkey)
export const VERSION_SCRIPT = 8; // P2SH

// Decimals: 1 KASPA = 100_000_000 sompi (8 decimal places)
export const DECIMALS = 8;
export const BASE_FACTOR = 100_000_000;

// RPC endpoints
export const MAINNET_RPC_URL = 'mainnet.kaspa.green';
export const TESTNET10_RPC_URL = 'testnet-10.kaspa.green';
export const TESTNET11_RPC_URL = 'testnet-11.kaspa.green';

// Default transaction fee (minimum relay fee in sompi)
export const DEFAULT_FEE = '1000'; // 0.00001 KASPA minimum

// Key constants
export const COMPRESSED_PUBKEY_LENGTH = 33; // bytes (02/03 + 32 bytes x-coord)
export const XONLY_PUBKEY_LENGTH = 32; // bytes (x-coordinate only for Schnorr)
export const PRIVATE_KEY_LENGTH = 32; // bytes

// Kaspa transaction version
export const TX_VERSION = 0;
