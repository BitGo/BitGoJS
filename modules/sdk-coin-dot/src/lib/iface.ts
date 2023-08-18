import { TransactionType, TransactionExplanation as BaseTransactionExplanation } from '@bitgo/sdk-core';
import { PolkadotSpecNameType } from '@bitgo/statics';
import { BaseTxInfo, TypeRegistry, DecodedUnsignedTx } from '@substrate/txwrapper-core/lib/types';

export { HexString } from '@polkadot/util/types';

/**
 * Section names for the transaction methods.
 */
export enum SectionNames {
  Proxy = 'proxy',
  Staking = 'staking',
}

/**
 * Method names for the transaction method. Names change based on the type of transaction e.g 'bond' for the staking transaction
 */
export enum MethodNames {
  /**
   * Register a proxy account for the sender that is able to make calls on its behalf.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#addproxydelegate-multiaddress-proxy_type-kitchensinkruntimeproxytype-delay-u32
   */
  AddProxy = 'addProxy',
  /**
   * Unregister a proxy account for the sender.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#removeproxydelegate-multiaddress-proxy_type-kitchensinkruntimeproxytype-delay-u32
   */
  RemoveProxy = 'removeProxy',
  /**
   * Dispatch the given call from an account that the sender is authorised for through add_proxy.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#proxyreal-multiaddress-force_proxy_type-optionkitchensinkruntimeproxytype-call-call
   */
  Proxy = 'proxy',
  /**
   * Take the origin account as a stash and lock up value of its balance. controller will be the account that controls it.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#bondcontroller-multiaddress-value-compactu128-payee-palletstakingrewarddestination
   */
  Bond = 'bond',
  /**
   * Add some extra amount that have appeared in the stash free_balance into the balance up for staking.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#bondextramax_additional-compactu128
   */
  BondExtra = 'bondExtra',
  /**
   * Transfer the entire transferable balance from the caller account.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#transferalldest-multiaddress-keep_alive-bool
   */
  TransferAll = 'transferAll',
  /**
   * Same as the transfer call, but with a check that the transfer will not kill the origin account.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#transferkeepalivedest-multiaddress-value-compactu128
   */
  TransferKeepAlive = 'transferKeepAlive',
  /**
   * Schedule a portion of the stash to be unlocked ready for transfer out after the bond period ends.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#unbondvalue-compactu128
   */
  Unbond = 'unbond',
  /**
   * @deprecated Anonymous proxies were renamed to pure proxies.
   *
   * @see PureProxy
   * @see https://polkadot.polkassembly.io/referendum/84
   */
  Anonymous = 'anonymous',
  /**
   * Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and initialize it with a proxy of proxy_type for origin sender.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#createpureproxy_type-kitchensinkruntimeproxytype-delay-u32-index-u16
   */
  PureProxy = 'createPure', // Anonymous proxies were renamed to pure proxies
  /**
   * Send a batch of dispatch calls.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#batchcalls-veccall
   */
  Batch = 'batch',
  /**
   * Send a batch of dispatch calls and atomically execute them. The whole transaction will rollback and fail if any of the calls failed.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#batchallcalls-veccall
   */
  BatchAll = 'batchAll',
  /**
   * Declare no desire to either validate or nominate.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#chill
   */
  Chill = 'chill',
  /**
   * Remove any unlocked chunks from the unlocking queue from our management.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#withdrawunbondednum_slashing_spans-u32
   */
  WithdrawUnbonded = 'withdrawUnbonded',
  /**
   * Pay out all the stakers behind a single validator for a single era.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#payoutstakersvalidator_stash-accountid32-era-u32
   */
  PayoutStakers = 'payoutStakers',
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  sender: string;
  referenceBlock: string;
  blockNumber: number;
  genesisHash: string;
  nonce: number;
  specVersion: number;
  transactionVersion: number;
  chainName: string;
  method?: string;
  specName?: string;
  amount?: string;
  to?: string;
  tip?: number;
  eraPeriod?: number;
  controller?: string;
  payee?: string;
  owner?: string;
  proxyType?: string;
  delay?: string;
  forceProxyType?: ProxyType;
  index?: string;
  batchCalls?: BatchCallObject[];
  numSlashingSpans?: number;
  validatorStash?: string;
  claimEra?: string;
  keepAlive?: boolean;
}

/**
 * Transaction method specific args
 */
export interface TransferArgs {
  dest: { id: string };
  value: string;
}

/**
 * Transaction method specific args
 */
export interface TransferAllArgs {
  dest: { id: string };
  keepAlive: boolean;
}

/**
 * Transaction method specific args
 */
export type StakeArgsPayee =
  | 'Staked'
  | 'Stash'
  | 'Controller'
  | {
      Account: string;
    };

/**
 * Transaction method specific args
 */
export type StakeArgsPayeeRaw = { controller?: null; stash?: null; staked?: null; account?: string };

/**
 * Transaction method specific args
 */
export interface StakeArgs {
  value: string;
  controller: { id: string };
  payee: StakeArgsPayee;
}

export interface StakeMoreArgs {
  maxAdditional: string;
}

export interface UnstakeArgs {
  value: string;
}

export interface WithdrawUnstakedArgs {
  numSlashingSpans: number;
}

export interface ClaimArgs {
  validatorStash: string;
  era: string;
}

/**
 * The types of proxies that can be setup and used
 * https://wiki.polkadot.network/docs/learn-proxies#proxy-types
 */
export enum ProxyType {
  ANY = 'Any',
  NON_TRANSFER = 'NonTransfer',
  STAKING = 'Staking',
  IDENTTITY_JUDGEMENT = 'IdentityJudgement',
  CANCEL_PROXY = 'CancelProxy',
}

/**
 * Transaction method specific args
 */
export interface AddProxyArgs {
  delegate: string | AccountId;
  delay: string;
  proxyType: ProxyType;
}

/**
 * Transaction method specific args
 */
export interface AddAnonymousProxyArgs {
  proxyType: ProxyType;
  index: string;
  delay: string;
}

/**
 * Transaction method specific args
 */
export type BatchCallObject = {
  callIndex: string;
  args:
    | Record<string, any>
    | AddProxyBatchCallArgs
    | AddAnonymousProxyBatchCallArgs
    | StakeBatchCallArgs
    | StakeMoreCallArgs;
};
export interface BatchArgs {
  calls: BatchCallObject[];
}

export interface AddAnonymousProxyBatchCallArgs {
  // Using snake_case here to be compatible with the library we use to decode
  // polkadot transactions
  proxy_type: ProxyType;
  index: number;
  delay: number;
}

export interface AddProxyBatchCallArgs {
  delegate: string | AccountId;
  proxy_type: ProxyType;
  delay: number;
}

export type AccountId = { id: string };

export type StakeBatchCallPayeeStaked = { staked: null };
export type StakeBatchCallPayeeStash = { stash: null };
export type StakeBatchCallPayeeController = { controller: null };
export type StakeBatchCallPayeeAccount = { account: string };

export type StakeBatchCallPayee =
  | StakeBatchCallPayeeStaked
  | StakeBatchCallPayeeStash
  | StakeBatchCallPayeeController
  | StakeBatchCallPayeeAccount;

export interface StakeBatchCallArgs {
  value: string;
  controller?: { id: string };
  payee: StakeBatchCallPayee;
}

export interface UnstakeBatchCallArgs {
  value: string;
}

export interface StakeMoreCallArgs {
  value: string;
}

/**
 * Transaction method specific args
 */
export type ProxyCallArgs = {
  callIndex: string;
  args: TransferArgs;
};

/**
 * Transaction method specific args
 */
export interface ProxyArgs {
  real: string | AccountId;
  forceProxyType: ProxyType;
}

/**
 * Decoded TxMethod from a transaction hex
 */
export interface TxMethod {
  args:
    | TransferArgs
    | TransferAllArgs
    | StakeArgs
    | StakeMoreArgs
    | AddProxyArgs
    | ProxyArgs
    | UnstakeArgs
    | AddAnonymousProxyArgs
    | BatchArgs
    | WithdrawUnstakedArgs
    | ClaimArgs;
  name: MethodNames;
  pallet: string;
}

/**
 * Modified unsigned transaction with a decoded method instead of a method hex
 */
export interface DecodedTx extends Omit<DecodedUnsignedTx, 'method'> {
  method: TxMethod;
}

/**
 * Base transaction info shared across all types of transactions
 */
export interface CreateBaseTxInfo {
  baseTxInfo: BaseTxInfo;
  options: {
    metadataRpc: `0x${string}`;
    registry: TypeRegistry;
    isImmortalEra?: boolean;
  };
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  forceProxyType?: ProxyType;
  controller?: string;
  payee?: string;
  owner?: string;
  proxyType?: string;
  delay?: string;
}

export enum TransactionTypes {
  TRANSFER = 'transfer',
  STAKING = 'staking',
  ADDR_INIT = 'addressInitialization',
  UNSTAKING = 'unstaking',
}
export interface Material {
  genesisHash: string;
  chainName: string;
  specName: PolkadotSpecNameType;
  specVersion: number;
  txVersion: number;
  metadata: `0x${string}`;
}
