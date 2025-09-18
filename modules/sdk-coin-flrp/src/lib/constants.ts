// Shared constants for Flare P-Chain (flrp) utilities and key handling.
// Centralizing avoids magic numbers scattered across utils and keyPair implementations.

export const DECODED_BLOCK_ID_LENGTH = 36; // Expected decoded block identifier length
export const SHORT_PUB_KEY_LENGTH = 50; // Placeholder (potential CB58 encoded form length)
export const COMPRESSED_PUBLIC_KEY_LENGTH = 66; // 33 bytes (compressed) hex encoded
export const UNCOMPRESSED_PUBLIC_KEY_LENGTH = 130; // 65 bytes (uncompressed) hex encoded
export const RAW_PRIVATE_KEY_LENGTH = 64; // 32 bytes hex encoded
export const SUFFIXED_PRIVATE_KEY_LENGTH = 66; // 32 bytes + compression flag suffix
export const PRIVATE_KEY_COMPRESSED_SUFFIX = '01';
export const OUTPUT_INDEX_HEX_LENGTH = 8; // 4 bytes serialized to hex length

// Asset and transaction constants
export const ASSET_ID_LENGTH = 32; // Asset ID length in bytes (standard for AVAX/Flare networks)
export const TRANSACTION_ID_HEX_LENGTH = 64; // Transaction ID length in hex characters (32 bytes)
export const PRIVATE_KEY_HEX_LENGTH = 64; // Private key length in hex characters (32 bytes)
export const SECP256K1_SIGNATURE_LENGTH = 65; // SECP256K1 signature length in bytes
export const BLS_PUBLIC_KEY_COMPRESSED_LENGTH = 96; // BLS public key compressed length in hex chars (48 bytes)
export const BLS_PUBLIC_KEY_UNCOMPRESSED_LENGTH = 192; // BLS public key uncompressed length in hex chars (96 bytes)
export const BLS_SIGNATURE_LENGTH = 192; // BLS signature length in hex characters (96 bytes)
export const CHAIN_ID_HEX_LENGTH = 64; // Chain ID length in hex characters (32 bytes)
export const MAX_CHAIN_ID_LENGTH = 128; // Maximum chain ID string length

// Fee constants (in nanoFLR)
export const DEFAULT_BASE_FEE = '1000000'; // 1M nanoFLR default base fee
export const DEFAULT_EVM_GAS_FEE = '21000'; // Standard EVM transfer gas fee
export const INPUT_FEE = '100000'; // 100K nanoFLR per input (FlareJS standard)
export const OUTPUT_FEE = '50000'; // 50K nanoFLR per output (FlareJS standard)
export const MINIMUM_FEE = '1000000'; // 1M nanoFLR minimum fee

// Validator constants
export const MIN_DELEGATION_FEE_BASIS_POINTS = 20000; // 2% minimum delegation fee

// Regex patterns
export const ADDRESS_REGEX = /^(^P||NodeID)-[a-zA-Z0-9]+$/;
export const HEX_REGEX = /^(0x){0,1}([0-9a-f])+$/i;

// Hex pattern components for building dynamic regexes
export const HEX_CHAR_PATTERN = '[0-9a-fA-F]';
export const HEX_PATTERN_NO_PREFIX = `^${HEX_CHAR_PATTERN}*$`;
export const HEX_PATTERN_WITH_PREFIX = `^0x${HEX_CHAR_PATTERN}`;

// Utility functions for creating hex validation regexes
export const createHexRegex = (length: number, requirePrefix = false): RegExp => {
  const pattern = requirePrefix ? `^0x${HEX_CHAR_PATTERN}{${length}}$` : `^${HEX_CHAR_PATTERN}{${length}}$`;
  return new RegExp(pattern);
};

export const createFlexibleHexRegex = (requirePrefix = false): RegExp => {
  const pattern = requirePrefix ? `^0x${HEX_CHAR_PATTERN}+$` : HEX_PATTERN_NO_PREFIX;
  return new RegExp(pattern);
};
