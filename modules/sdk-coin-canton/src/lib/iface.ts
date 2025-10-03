import { TransactionType } from '@bitgo/sdk-core';
import { PartyId } from '@canton-network/core-types';

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  type: TransactionType;
  sender: string;
  receiver: string;
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
  partyId: PartyId;
}
