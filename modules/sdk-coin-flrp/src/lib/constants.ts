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

// Regex patterns
export const ADDRESS_REGEX = /^(^P||NodeID)-[a-zA-Z0-9]+$/;
export const HEX_REGEX = /^(0x){0,1}([0-9a-f])+$/i;
