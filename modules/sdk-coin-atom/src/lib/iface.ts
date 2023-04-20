import { TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface MessageData {
  typeUrl: string;
  value: SendMessage | DelegateOrUndelegeteMessage | WithdrawDelegatorRewardsMessage;
}

export interface SendMessage {
  fromAddress: string;
  toAddress: string;
  amount: Coin[];
}

export interface DelegateOrUndelegeteMessage {
  delegatorAddress: string;
  validatorAddress: string;
  amount: Coin;
}

export interface WithdrawDelegatorRewardsMessage {
  delegatorAddress: string;
  validatorAddress: string;
}

export interface FeeData {
  amount: Coin[];
  gasLimit: number;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData extends AtomTransaction {
  id?: string;
  type?: TransactionType;
  accountNumber: number;
  chainId: string;
}

export interface AtomTransaction {
  readonly sequence: number;
  readonly sendMessages: MessageData[];
  readonly gasBudget: FeeData;
  readonly publicKey?: string;
  readonly signature?: Uint8Array;
  readonly hash?: string;
  readonly memo?: string;
}
