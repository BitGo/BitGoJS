import { TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';

/**
 * Defines the protobuf typeUrl for the public key
 */
export enum PubKeyTypeUrl {
  secp256k1 = '/cosmos.crypto.secp256k1.PubKey',
  ethSecp256k1 = '/ethermint.crypto.v1.ethsecp256k1.PubKey',
}

/**
 * Defines the amino encoding name for the public key
 */
export enum PubKeyType {
  secp256k1 = 'tendermint/PubKeySecp256k1',
  ethSecp256k1 = 'tendermint/PubKeyEthSecp256k1',
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface SendMessage {
  fromAddress: string;
  toAddress: string;
  amount: Coin[];
}

export interface RecoveryOptions {
  userKey?: string; // Box A
  backupKey?: string; // Box B
  bitgoKey?: string;
  rootAddress?: string;
  recoveryDestination: string;
  krsProvider?: string;
  walletPassphrase?: string;
}

export interface CosmosLikeCoinRecoveryOutput {
  serializedTx?: string;
  signableHex?: string;
}

export interface DelegateOrUndelegeteMessage {
  delegatorAddress: string;
  validatorAddress: string;
  amount: Coin;
}

export interface RedelegateMessage {
  delegatorAddress: string;
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: Coin;
}

export interface WithdrawDelegatorRewardsMessage {
  delegatorAddress: string;
  validatorAddress: string;
}

export interface ExecuteContractMessage {
  sender: string;
  contract: string;
  msg: Uint8Array;
  funds?: Coin[];
}

export type CosmosTransactionMessage<CustomMessage = never> =
  | SendMessage
  | DelegateOrUndelegeteMessage
  | WithdrawDelegatorRewardsMessage
  | ExecuteContractMessage
  | RedelegateMessage
  | CustomMessage;

export interface MessageData<CustomMessage = never> {
  typeUrl: string;
  value: CosmosTransactionMessage<CustomMessage>;
}

export interface FeeData {
  amount: Coin[];
  gasLimit: number;
}

export interface GasAmountDetails {
  gasAmount: string;
  gasLimit: number;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData<CustomMessage = never> extends CosmosLikeTransaction<CustomMessage> {
  id?: string;
  type?: TransactionType;
  accountNumber: number;
  chainId: string;
}

export interface CosmosLikeTransaction<CustomMessage = never> {
  readonly sequence: number;
  readonly sendMessages: MessageData<CustomMessage>[];
  readonly gasBudget: FeeData;
  readonly publicKey?: string;
  readonly signature?: Uint8Array;
  readonly hash?: string;
  readonly memo?: string;
}
