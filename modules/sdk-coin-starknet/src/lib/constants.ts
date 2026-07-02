import { StarknetResourceBounds } from './iface';

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

// V3 transaction hash prefix: encodeShortString("invoke")
export const INVOKE_TX_PREFIX = 0x696e766f6b65n;

// V3 transaction hash prefix: encodeShortString("deploy_account")
export const DEPLOY_ACCOUNT_TX_PREFIX = 0x6465706c6f795f6163636f756e74n;

// V3 transaction version
export const TRANSACTION_VERSION_3 = 3n;

// Resource bound type names (short-string encoded felts)
export const L1_GAS_NAME = 0x4c315f474153n; // "L1_GAS"
export const L2_GAS_NAME = 0x4c325f474153n; // "L2_GAS"
export const L1_DATA_GAS_NAME = 0x4c315f44415441n; // "L1_DATA" — NOT "L1_DATA_GAS"

/** Default v3 resource bounds (matches TransactionBuilder defaults). */
export function defaultResourceBounds(): StarknetResourceBounds {
  return {
    l2_gas: { max_amount: '0x1c9c380', max_price_per_unit: '0x174876e800' },
    l1_gas: { max_amount: '0x0', max_price_per_unit: '0x5af3107a4000' },
    l1_data_gas: { max_amount: '0x3e8', max_price_per_unit: '0x2540be400' },
  };
}

// Fixed gas amounts per tx-type. EthAccount secp256k1 __validate__ costs ~24M L2 gas; 40M ≈ 1.6x buffer.
export const RECOVERY_L2_GAS_MAX_AMOUNT = '0x2625a00'; // 40,000,000
export const RECOVERY_L1_DATA_GAS_MAX_AMOUNT = '0xbb8'; // 3,000
export const RECOVERY_GAS_PRICE_BUFFER_MULTIPLIER = 2n;
// Floor for the committed L2 price. The Starknet sequencer currently requires ≥ ~29 GFri;
export const RECOVERY_L2_GAS_MIN_PRICE_PER_UNIT = 50_000_000_000n;
