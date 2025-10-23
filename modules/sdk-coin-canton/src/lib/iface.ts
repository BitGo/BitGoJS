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

export interface WalletInitTxData {
  id: string;
  type: TransactionType;
  preparedParty: PreparedParty;
}

export interface CantonPrepareCommandResponse {
  preparedTransaction?: string;
  preparedTransactionHash: string;
  hashingSchemeVersion: string;
  hashingDetails?: string | null;
}

export interface PreparedParty {
  partyId: string;
  publicKeyFingerprint: string;
  topologyTransactions: string[];
  multiHash: string;
}

export interface PreparedTransaction {
  transaction?: DamlTransaction;
  metadata?: Metadata;
}

export interface IPublicKey {
  format: string;
  keyData: string;
  keySpec: string;
}

export interface WalletInitRequest {
  partyHint: string;
  publicKey: IPublicKey;
  localParticipantObservationOnly: boolean;
  otherConfirmingParticipantUids: string[];
  confirmationThreshold: number;
  observingParticipantUids: string[];
}

export interface CantonPrepareCommandRequest {
  commandId: string;
  verboseHashing: boolean;
  actAs: string[];
  readAs: string[];
}

export interface OnboardingTransaction {
  transaction: string;
}

export interface MultiHashSignature {
  format: string;
  signature: string;
  signedBy: string;
  signingAlgorithmSpec: string;
}

export interface WalletInitBroadcastData {
  preparedParty: PreparedParty;
  onboardingTransactions: OnboardingTransaction[];
  multiHashSignatures: MultiHashSignature[];
}

export interface CantonOneStepEnablementRequest extends CantonPrepareCommandRequest {
  receiverId: string;
}

export interface CantonTransferAcceptRequest extends CantonPrepareCommandRequest {
  contractId: string;
}
