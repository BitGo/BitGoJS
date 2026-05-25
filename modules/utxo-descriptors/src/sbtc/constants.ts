/**
 * Well-known unspendable Taproot internal key.
 *
 * Nothing-up-my-sleeve point on secp256k1 with no known private key. Using it
 * as a Taproot internal key guarantees the output cannot be spent via the
 * key path — only via one of the script-path leaves.
 */
export const UNSPENDABLE_INTERNAL_KEY = '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';

/**
 * Default reclaim relative timelock — number of Bitcoin blocks the depositor
 * must wait before they can reclaim their BTC if the sBTC signers fail to
 * process the deposit.
 */
export const DEFAULT_RECLAIM_LOCK_TIME = 950;

/**
 * Default max signer fee in satoshis. Encoded as a big-endian u64 (8 bytes)
 * inside the deposit-leaf metadata payload.
 */
export const DEFAULT_MAX_SIGNER_FEE = 80_000;

/** Length of the encoded sBTC max-fee field, in bytes. */
export const MAX_FEE_BYTE_LENGTH = 8;

/**
 * Length of the Stacks recipient field inside the deposit payload — 22 bytes:
 *   byte 0      = Clarity principal type (0x05 standard, 0x06 contract)
 *   byte 1      = Stacks address version (e.g. 0x16 mainnet, 0x1a testnet)
 *   bytes 2..21 = 20-byte hash160 of the principal
 */
export const STACKS_RECIPIENT_BYTE_LENGTH = 22;
