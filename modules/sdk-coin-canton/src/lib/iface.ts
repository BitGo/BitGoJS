import {
  TransactionType,
  TransactionExplanation as BaseTransactionExplanation,
  ITransactionRecipient,
} from '@bitgo/sdk-core';
import { DamlTransaction, Metadata } from './resourcesInterface';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  inputs?: ITransactionRecipient[];
  inputAmount?: string;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  type: TransactionType;
  sender: string;
  receiver: string;
  amount: string;
  acknowledgeData?: TransferAcknowledge;
  memoId?: string;
}

export interface PreparedTxnParsedInfo {
  sender: string;
  receiver: string;
  amount: string;
  memoId?: string;
}

export interface WalletInitTxData {
  id: string;
  type: TransactionType;
  preparedParty: PreparedParty;
}

export interface UTXOInfo {
  contractId: string;
  value: string;
}

export interface CantonPrepareCommandResponse {
  preparedTransaction?: string;
  preparedTransactionHash: string;
  hashingSchemeVersion: string;
  hashingDetails?: string | null;
  utxoInfo?: UTXOInfo[];
  isOneStepTransfer?: boolean;
}

export interface PreparedParty {
  partyId: string;
  publicKeyFingerprint: string;
  topologyTransactions: string[];
  multiHash: string;
  shouldIncludeTxnType?: boolean;
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

export interface PartySignature {
  party: string;
  signatures: MultiHashSignature[];
}

export interface TransactionBroadcastData {
  acknowledgeData?: TransferAcknowledge;
  prepareCommandResponse?: CantonPrepareCommandResponse;
  txType: string;
  preparedTransaction?: string;
  partySignatures?: {
    signatures: PartySignature[];
  };
  deduplicationPeriod?: {
    Empty: Record<string, never>;
  };
  submissionId: string;
  hashingSchemeVersion?: string;
  minLedgerTime?: {
    time: {
      Empty: Record<string, never>;
    };
  };
}

export interface CantonOneStepEnablementRequest extends CantonPrepareCommandRequest {
  receiverId: string;
}

export interface CantonTransferAcceptRejectRequest extends CantonPrepareCommandRequest {
  contractId: string;
}

export interface TransferAcknowledge {
  contractId: string;
  senderPartyId: string;
  amount: number;
  expiryEpoch: number;
  updateId: string;
}

export interface CantonTransferRequest {
  commandId: string;
  senderPartyId: string;
  receiverPartyId: string;
  amount: number;
  expiryEpoch: number;
  sendViaOneStep: boolean;
  memoId?: string;
}
