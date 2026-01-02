/**
 * @prettier
 * ZKsync-specific types and interfaces
 */

/**
 * Paymaster parameters for ZKsync transactions (Account Abstraction feature)
 * Note: Only needed if supporting AA wallets. Standard multisig transactions don't require this.
 */
export interface PaymasterParams {
  /** Address of the paymaster contract */
  paymaster: string;
  /** Encoded input data for the paymaster */
  paymasterInput: string;
}

/**
 * ZKsync-specific fee structure
 */
export interface ZKsyncFee {
  /** Gas limit for the transaction */
  gasLimit: string;
  /** Maximum gas per pubdata byte limit (ZKsync-specific) */
  gasPerPubdataByteLimit?: string;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas: string;
  /** Max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas: string;
  /** Gas price for L1 (legacy, if applicable) */
  gasPrice?: string;
}

/**
 * Fee estimation response from zks_estimateFee
 */
export interface ZKsyncFeeEstimate {
  /** Gas limit */
  gas_limit: string;
  /** Gas per pubdata byte limit */
  gas_per_pubdata_limit: string;
  /** Max fee per gas */
  max_fee_per_gas: string;
  /** Max priority fee per gas */
  max_priority_fee_per_gas: string;
}

/**
 * Bridge contract addresses
 */
export interface BridgeAddresses {
  /** L1 shared bridge proxy address */
  l1SharedDefaultBridge?: string;
  /** L2 shared bridge proxy address */
  l2SharedDefaultBridge?: string;
  /** L1 ERC20 default bridge proxy */
  l1Erc20DefaultBridge?: string;
  /** L2 ERC20 default bridge */
  l2Erc20DefaultBridge?: string;
  /** L1 WETH bridge proxy */
  l1WethBridge?: string;
  /** L2 WETH bridge */
  l2WethBridge?: string;
}

/**
 * Priority operation parameters for L1->L2 transactions
 */
export interface PriorityOpParams {
  /** L2 contract address to call */
  contractAddressL2: string;
  /** L2 gas limit */
  l2GasLimit: string;
  /** L2 value to transfer */
  l2Value?: string;
  /** Calldata for the L2 contract */
  calldata?: string;
  /** Factory dependencies (contract bytecode for deployment) */
  factoryDeps?: string[];
  /** Refund recipient on L2 */
  refundRecipient?: string;
}

/**
 * Withdrawal parameters for L2->L1 transactions
 */
export interface WithdrawalParams {
  /** Token address on L2 (use ETH_ADDRESS for native ETH) */
  token: string;
  /** Amount to withdraw */
  amount: string;
  /** Recipient address on L1 */
  to?: string;
  /** Bridge address to use (optional, uses default if not specified) */
  bridgeAddress?: string;
}

/**
 * ZKsync transaction data extending standard Ethereum transaction
 */
export interface ZKsyncTxData {
  /** Transaction type (113 for EIP-712) */
  txType?: number;
  /** Sender address */
  from?: string;
  /** Recipient address */
  to?: string;
  /** Gas limit */
  gasLimit: string;
  /** Gas per pubdata byte limit */
  gasPerPubdataByteLimit?: string;
  /** Max fee per gas */
  maxFeePerGas?: string;
  /** Max priority fee per gas */
  maxPriorityFeePerGas?: string;
  /** Paymaster parameters (optional, only for AA wallets) */
  paymaster?: string;
  /** Paymaster input (optional, only for AA wallets) */
  paymasterInput?: string;
  /** Factory dependencies for contract deployment (optional) */
  factoryDeps?: string[];
  /** Transaction data/calldata */
  data?: string;
  /** Value to transfer */
  value?: string;
  /** Nonce */
  nonce?: number;
  /** Chain ID */
  chainId?: string;
  /** Custom signature (for EIP-712) */
  customSignature?: string;
}

/**
 * System contract addresses on ZKsync
 */
export const ZKSYNC_SYSTEM_CONTRACTS = {
  /** Bootloader address */
  BOOTLOADER: '0x0000000000000000000000000000000000008001',
  /** Account code storage */
  ACCOUNT_CODE_STORAGE: '0x0000000000000000000000000000000000008002',
  /** Nonce holder */
  NONCE_HOLDER: '0x0000000000000000000000000000000000008003',
  /** Known codes storage */
  KNOWN_CODES_STORAGE: '0x0000000000000000000000000000000000008004',
  /** Immutable simulator */
  IMMUTABLE_SIMULATOR: '0x0000000000000000000000000000000000008005',
  /** Contract deployer */
  CONTRACT_DEPLOYER: '0x0000000000000000000000000000000000008006',
  /** Force deploy upgrader */
  FORCE_DEPLOYER: '0x0000000000000000000000000000000000008007',
  /** L1 messenger */
  L1_MESSENGER: '0x0000000000000000000000000000000000008008',
  /** Message transmitter */
  MSG_VALUE_SYSTEM_CONTRACT: '0x0000000000000000000000000000000000008009',
  /** ETH token (L2 base token) */
  ETH_TOKEN: '0x000000000000000000000000000000000000800a',
  /** System context */
  SYSTEM_CONTEXT: '0x000000000000000000000000000000000000800b',
  /** Bootloader utilities */
  BOOTLOADER_UTILITIES: '0x000000000000000000000000000000000000800c',
  /** Event writer */
  EVENT_WRITER: '0x000000000000000000000000000000000000800d',
  /** Compressor */
  COMPRESSOR: '0x000000000000000000000000000000000000800e',
  /** Complex upgrader */
  COMPLEX_UPGRADER: '0x000000000000000000000000000000000000800f',
  /** Keccak256 */
  KECCAK256: '0x0000000000000000000000000000000000008010',
  /** Code Oracle */
  CODE_ORACLE: '0x0000000000000000000000000000000000008011',
  /** P256 verify */
  P256_VERIFY: '0x0000000000000000000000000000000000008012',
} as const;

/**
 * Default gas per pubdata byte limit
 */
export const DEFAULT_GAS_PER_PUBDATA_LIMIT = '50000';

/**
 * ETH address constant for native ETH operations
 */
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * EIP-712 transaction type
 */
export const EIP_712_TX_TYPE = 0x71;
