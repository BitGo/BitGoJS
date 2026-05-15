// OZ EthAccountUpgradeable class hash (v0.17.0) — secp256k1 signature verification
export const OZ_ETH_ACCOUNT_CLASS_HASH = '0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06';

// STRK token contract (same on both mainnet and sepolia)
export const STRK_TOKEN_CONTRACT = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

// felt252 max value (2^251 + 17 * 2^192 + 1)
export const FELT_MAX = (1n << 251n) + 17n * (1n << 192n) + 1n;

// u256 split mask (128 bits)
export const MASK_128 = (1n << 128n) - 1n;

// Contract address bound: 2^251 - 256
export const ADDR_BOUND = 2n ** 251n - 256n;

// encodeShortString('STARKNET_CONTRACT_ADDRESS')
export const CONTRACT_ADDRESS_PREFIX = 0x535441524b4e45545f434f4e54524143545f41444452455353n;

export const DEFAULT_SEED_SIZE_BYTES = 16;
