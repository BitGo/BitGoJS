import { TransactionType } from '@bitgo/sdk-core';
import { DamlTransaction, Metadata } from './resourcesInterface';

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  type: TransactionType;
  sender: string;
  receiver: string;
}

export interface PreparedTxnParsedInfo {
  sender: string;
  receiver: string;
  amount: string;
}

export interface WalletInitializationDataTxData {
  id: string;
  type: TransactionType;
}

export interface CantonPrepareCommandResponse {
  preparedTransaction?: string;
  preparedTransactionHash: string;
  hashingSchemeVersion: string;
  hashingDetails?: string;
}

export interface PreparedParty {
  partyTransactions: Uint8Array<ArrayBufferLike>[];
  combinedHash: string;
  txHashes: Buffer<ArrayBuffer>[];
  namespace: string;
  partyId: string;
}

export interface PreparedTransaction {
  transaction?: DamlTransaction;
  metadata?: Metadata;
}
