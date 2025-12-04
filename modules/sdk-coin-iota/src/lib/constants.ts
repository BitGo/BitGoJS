// ========================================
// Address and Digest Length Constants
// ========================================

/**
 * Length of IOTA addresses in characters (excluding 0x prefix).
 * IOTA uses 64-character hexadecimal addresses.
 */
export const IOTA_ADDRESS_LENGTH = 64;

/**
 * Length of transaction digest in bytes.
 * Used for transaction IDs and hashes.
 */
export const IOTA_TRANSACTION_DIGEST_LENGTH = 32;

/**
 * Length of block digest in bytes.
 * Used for block IDs and references.
 */
export const IOTA_BLOCK_DIGEST_LENGTH = 32;

// ========================================
// Cryptographic Constants
// ========================================

/**
 * Length of Ed25519 signatures in bytes.
 * IOTA uses Ed25519 for transaction signing.
 */
export const IOTA_SIGNATURE_LENGTH = 64;

/**
 * Length of Ed25519 public keys in bytes.
 * Standard Ed25519 key size.
 */
export const IOTA_KEY_BYTES_LENGTH = 32;

// ========================================
// Transaction Object Limits
// ========================================

/**
 * Maximum number of input objects allowed in a single transaction.
 * This limit ensures transactions can be processed efficiently by the network.
 */
export const MAX_INPUT_OBJECTS = 2048;

/**
 * Maximum number of gas payment objects allowed per transaction.
 * When exceeded, objects must be merged before the transaction can be built.
 * This prevents transaction size from becoming too large.
 */
export const MAX_GAS_PAYMENT_OBJECTS = 256;

/**
 * Maximum number of recipients in a transfer transaction.
 * Limits the number of outputs to keep transaction size manageable.
 */
export const MAX_RECIPIENTS = 256;

// ========================================
// Gas Configuration Limits
// ========================================

/**
 * Maximum gas budget allowed for a transaction.
 * Used for dry-run simulations to estimate gas costs.
 * Set to a very high value (50 billion) to ensure simulation completes.
 */
export const MAX_GAS_BUDGET = 50000000000;

/**
 * Maximum gas price for simulated transactions.
 * Used when building dry-run transactions for gas estimation.
 */
export const MAX_GAS_PRICE = 100000;

// ========================================
// Transaction Command Types
// ========================================

/**
 * Valid command types for transfer transactions.
 * Transfer transactions can only contain these three command types:
 * - SplitCoins: Split a coin into multiple coins with specified amounts
 * - MergeCoins: Merge multiple coins into a single coin
 * - TransferObjects: Transfer coins/objects to recipients
 */
export const TRANSFER_TRANSACTION_COMMANDS = ['SplitCoins', 'MergeCoins', 'TransferObjects'];
