import { PolkadotSpecNameType } from '@bitgo/statics';
import { BaseTxInfo, TypeRegistry, DecodedUnsignedTx } from '@substrate/txwrapper-core/lib/types';
import { TransactionType } from '../baseCoin';
import { TransactionExplanation as BaseTransactionExplanation } from '../baseCoin/iface';

/**
 * Method names for the transaction method. Names change based on the type of transaction e.g 'bond' for the staking transaction
 */
export enum MethodNames {
  AddProxy = 'addProxy',
  Proxy = 'proxy',
  Bond = 'bond',
  TransferKeepAlive = 'transferKeepAlive',
  Unbond = 'unbond',
  Anonymous = 'anonymous',
  Batch = 'batch',
  Chill = 'chill',
  WithdrawUnbonded = 'withdrawUnbonded',
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

export interface UnstakeArgs {
  value: string;
}

export interface WithdrawUnstakedArgs {
  numSlashingSpans: number;
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
  delegate: string;
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
  args: Record<string, any>;
};
export interface BatchArgs {
  calls: BatchCallObject[];
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
  real: string;
  forceProxyType: ProxyType;
}

/**
 * Decoded TxMethod from a transaction hex
 */
export interface TxMethod {
  args:
    | TransferArgs
    | StakeArgs
    | AddProxyArgs
    | ProxyArgs
    | UnstakeArgs
    | AddAnonymousProxyArgs
    | BatchArgs
    | WithdrawUnstakedArgs;
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
