import { TransactionFee } from '@bitgo/sdk-core';
import { ITransactionExplanation } from './transactionExplanation';

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  sender: string;
  destination: string;
  destinationAlias: string;
  amount: string;
  withdrawAmount: string;
  seqno: number;
  expirationTime: number;
  publicKey: string;
  sub_wallet_id: number;
  signature: string;
  bounceable: boolean;
}

export type TransactionExplanation = ITransactionExplanation<TransactionFee>;

export type VestingContractParams = {
  subWalletId: number;
  publicKeyHex: string;
  vestingStartTime: number;
  vestingTotalDuration: number;
  unlockPeriod: number;
  cliffDuration: number;
  vestingTotalAmount: bigint;
  vestingSenderAddress: string;
  ownerAddress: string;
};
