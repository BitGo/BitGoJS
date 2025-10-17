import * as t from 'io-ts';

/**
 * Wallet user with permissions
 */
export const WalletUser = t.type({
  user: t.string,
  permissions: t.array(t.string),
});

/**
 * Address balance information
 */
export const AddressBalance = t.type({
  updated: t.string,
  balance: t.number,
  balanceString: t.string,
  totalReceived: t.number,
  totalSent: t.number,
  confirmedBalanceString: t.string,
  spendableBalanceString: t.string,
});

/**
 * Address information
 */
export const ReceiveAddress = t.partial({
  /** Address ID */
  id: t.string,
  /** The actual address string */
  address: t.string,
  /** Chain index (0 for external, 1 for internal) */
  chain: t.number,
  /** Address index */
  index: t.number,
  /** Coin type */
  coin: t.string,
  /** Wallet ID this address belongs to */
  wallet: t.string,
  /** Last nonce used */
  lastNonce: t.number,
  /** Coin-specific address data */
  coinSpecific: t.UnknownRecord,
  /** Address balance information */
  balance: AddressBalance,
  /** Address label */
  label: t.string,
  /** Address type (e.g., 'p2sh', 'p2wsh') */
  addressType: t.string,
});

/**
 * Policy rule for wallet
 */
export const PolicyRule = t.partial({
  /** Rule ID */
  id: t.string,
  /** Rule type */
  type: t.string,
  /** Date when rule becomes locked */
  lockDate: t.string,
  /** Mutability constraint */
  mutabilityConstraint: t.string,
  /** Coin this rule applies to */
  coin: t.string,
  /** Rule condition */
  condition: t.UnknownRecord,
  /** Rule action */
  action: t.UnknownRecord,
});

/**
 * Wallet policy
 */
export const WalletPolicy = t.partial({
  /** Policy ID */
  id: t.string,
  /** Policy creation date */
  date: t.string,
  /** Policy version number */
  version: t.number,
  /** Policy label */
  label: t.string,
  /** Whether this is the latest version */
  latest: t.boolean,
  /** Policy rules */
  rules: t.array(PolicyRule),
});

/**
 * Admin settings for wallet
 */
export const WalletAdmin = t.partial({
  policy: WalletPolicy,
});

/**
 * Freeze information
 */
export const WalletFreeze = t.partial({
  time: t.string,
  expires: t.string,
});

/**
 * Build defaults for wallet transactions
 */
export const BuildDefaults = t.partial({
  minFeeRate: t.number,
  maxFeeRate: t.number,
  feeMultiplier: t.number,
  changeAddressType: t.string,
  txFormat: t.string,
});

/**
 * Custom change key signatures
 */
export const CustomChangeKeySignatures = t.partial({
  user: t.string,
  backup: t.string,
  bitgo: t.string,
});

/**
 * Wallet response data
 * Comprehensive wallet information returned from wallet operations
 * Based on WalletData interface from sdk-core
 */
export const WalletResponse = t.partial({
  /** Wallet ID */
  id: t.string,
  /** Wallet label/name */
  label: t.string,
  /** Coin type (e.g., btc, tlnbtc, lnbtc) */
  coin: t.string,
  /** Array of keychain IDs */
  keys: t.array(t.string),
  /** Number of signatures required (m in m-of-n) */
  m: t.number,
  /** Total number of keys (n in m-of-n) */
  n: t.number,
  /** Number of approvals required for transactions */
  approvalsRequired: t.number,
  /** Wallet balance as number */
  balance: t.number,
  /** Confirmed balance as number */
  confirmedBalance: t.number,
  /** Spendable balance as number */
  spendableBalance: t.number,
  /** Wallet balance as string */
  balanceString: t.string,
  /** Confirmed balance as string */
  confirmedBalanceString: t.string,
  /** Spendable balance as string */
  spendableBalanceString: t.string,
  /** Number of unspent outputs */
  unspentCount: t.number,
  /** Enterprise ID this wallet belongs to */
  enterprise: t.string,
  /** Wallet type (e.g., 'hot', 'cold', 'custodial') */
  type: t.string,
  /** Wallet subtype (e.g., 'lightningSelfCustody') */
  subType: t.string,
  /** Multisig type ('onchain' or 'tss') */
  multisigType: t.union([t.literal('onchain'), t.literal('tss')]),
  /** Multisig type version (e.g., 'MPCv2') */
  multisigTypeVersion: t.string,
  /** Coin-specific wallet data */
  coinSpecific: t.UnknownRecord,
  /** Admin settings including policy */
  admin: WalletAdmin,
  /** Users with access to this wallet */
  users: t.array(WalletUser),
  /** Receive address information */
  receiveAddress: ReceiveAddress,
  /** Whether the wallet can be recovered */
  recoverable: t.boolean,
  /** Tags associated with the wallet */
  tags: t.array(t.string),
  /** Whether backup key signing is allowed */
  allowBackupKeySigning: t.boolean,
  /** Build defaults for transactions */
  buildDefaults: BuildDefaults,
  /** Whether the wallet is cold storage */
  isCold: t.boolean,
  /** Custodial wallet information */
  custodialWallet: t.UnknownRecord,
  /** Custodial wallet ID */
  custodialWalletId: t.string,
  /** Whether the wallet is deleted */
  deleted: t.boolean,
  /** Whether transaction notifications are disabled */
  disableTransactionNotifications: t.boolean,
  /** Freeze status */
  freeze: WalletFreeze,
  /** Node ID for lightning wallets */
  nodeId: t.string,
  /** Pending approvals for this wallet */
  pendingApprovals: t.array(t.UnknownRecord),
  /** Start date information */
  startDate: t.UnknownRecord,
  /** Custom change key signatures */
  customChangeKeySignatures: CustomChangeKeySignatures,
  /** Wallet which this was migrated from */
  migratedFrom: t.string,
  /** EVM keyring reference wallet ID */
  evmKeyRingReferenceWalletId: t.string,
  /** Whether this is a parent wallet */
  isParent: t.boolean,
  /** Enabled child chains */
  enabledChildChains: t.array(t.string),
  /** Wallet flags */
  walletFlags: t.array(
    t.type({
      name: t.string,
      value: t.string,
    })
  ),
  /** Token balances */
  tokens: t.array(t.UnknownRecord),
  /** NFT balances */
  nfts: t.record(t.string, t.UnknownRecord),
  /** Unsupported NFT balances */
  unsupportedNfts: t.record(t.string, t.UnknownRecord),
});
