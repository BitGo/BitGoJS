export const DEFAULT_SUBSTRATE_PREFIX = 42;

/**
 * Substrate signs the raw encoded `ExtrinsicPayload` only when it is at most this many bytes;
 * larger payloads are signed as their blake2_256 hash instead. See `getSubstrateSigningBytes`.
 */
export const MAX_RAW_SIGNING_PAYLOAD_BYTES = 256;
