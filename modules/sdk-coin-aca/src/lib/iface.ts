import { AcalaSpecNameType } from '@bitgo/statics';
export { HexString } from '@polkadot/util/types';
import { BaseTxInfo, TypeRegistry, DecodedUnsignedTx, TokenSymbol } from '@acala-network/txwrapper-acala';
import { TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';

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
  PayoutStakers = 'payoutStakers',
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
export interface TransferArgs {
  dest: { id: string };
  amount: string;
}

/**
 * Transaction method specific args
 */
export interface TokenTransferArgs {
  dest: { id: string };
  amount: string;
  currencyId: { token: TokenSymbol };
}

/**
 * Decoded TxMethod from a transaction hex
 */
export interface TxMethod {
  args: TransferArgs | BatchArgs | TokenTransferArgs;
  name: MethodNames;
  pallet: string;
}

/**
 * Modified unsigned transaction with a decoded method instead of a method hex
 */
export interface DecodedTx extends Omit<DecodedUnsignedTx, 'method'> {
  method: TxMethod;
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
  token?: TokenSymbol;
}

export interface Material {
  genesisHash: string;
  chainName: string;
  specName: AcalaSpecNameType;
  specVersion: number;
  txVersion: number;
  metadata: `0x${string}`;
}
