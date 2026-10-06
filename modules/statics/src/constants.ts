export const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

export const HEDERA_NODE_ACCCOUNT_ID = '0.0.3';

/**
 * Highest BIP32 child index below the hardened offset (2^31 - 1), which is also the highest valid
 * BIP44 coin type.
 */
export const MAX_BIP32_INDEX = 0x7fffffff;
