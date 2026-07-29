import {
  TransactionType,
  TransactionExplanation as BaseTransactionExplanation,
  ITransactionRecipient,
  CantonCommand,
  CantonCommandResolveContractSpec,
} from '@bitgo/sdk-core';
import { DamlTransaction, Metadata } from './resourcesInterface';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  inputs?: ITransactionRecipient[];
  inputAmount?: string;
  cantonCommand?: CantonCommandExplain;
}

export interface CantonCommandExplain {
  kind: CantonCommandKind;
  templateId: string;
  actAs: string[];
  choice?: string;
  contractId?: string;
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
  cosignDelegationProposalData?: CosignDelegationProposal;
  allocationRequestData?: AllocationRequest;
  endInvestorOnboardingOfferData?: EndInvestorOnboardingOfferData;
  memoId?: string;
  token?: string;
  cantonCommand?: CantonCommandExplain;
}

export interface PreparedTxnParsedInfo {
  sender: string;
  receiver: string;
  amount: string;
  memoId?: string;
  token?: string;
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
  cosignDelegationProposalData?: CosignDelegationProposal;
  allocationRequestData?: AllocationRequest;
  endInvestorOnboardingOfferData?: EndInvestorOnboardingOfferData;
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
  tokenName?: string;
}

export interface CantonTransferAcceptRejectRequest extends CantonPrepareCommandRequest {
  contractId: string;
}

export interface CantonTransferOfferWithdrawnRequest extends CantonTransferAcceptRejectRequest {
  tokenName?: string;
}

export interface CantonAllocationAllocateWithdrawnRequest extends CantonTransferAcceptRejectRequest {
  tokenName?: string;
}

export interface TransferAcknowledge {
  contractId: string;
  senderPartyId: string;
  amount: number;
  expiryEpoch: number;
  updateId: string;
}

export interface CosignDelegationProposal {
  contractId: string;
  operatorId: string;
  updateId: string;
  packageName?: string;
}

export interface CantonTransferRequest {
  commandId: string;
  senderPartyId: string;
  receiverPartyId: string;
  amount: number;
  expiryEpoch: number;
  sendViaOneStep: boolean;
  memoId?: string;
  tokenName?: string;
}

export interface CantonAllocationAllocateRequest {
  commandId: string;
  amount: number;
  token: string;
  operatorId: string;
  contractId?: string;
  tradeId: string;
  transferLegId: string;
  allocateBefore: string;
  settleBefore: string;
  receiverPartyId: string;
  senderPartyId: string;
  comment?: string;
}

/**
 * Internal (non-signable) data for an AllocationRequest txRequest.
 * Surfaces the full DvP trade leg to the allocating party so they can
 * review and then submit an AllocationAllocate.
 */
export interface AllocationRequest {
  updateId: string;
  operatorId: string;
  contractId?: string;
  tradeId: string;
  transferLegId: string;
  senderPartyId: string;
  receiverPartyId: string;
  amount: number;
  token: string;
  receiveToken: string;
  receiveAmount: number;
  allocateBefore: string;
  settleBefore: string;
  comment?: string;
}

/**
 * Internal (non-signable) data for an EndInvestorOnboardingOffer txRequest.
 * Records an on-chain EndInvestorOnboardingOffer contract on the end investor's wallet
 * so they can accept or reject. Built locally without an IMS call — the participant
 * party may be external (non-BitGo) and therefore not registered in BitGo's IMS.
 */
export interface EndInvestorOnboardingOfferData {
  /** The on-chain contractId of the EndInvestorOnboardingOffer (from pendingContractId). */
  contractId: string;
  /** Canton party ID of the end investor being onboarded. */
  endInvestorPartyId: string;
  /** Canton party ID of the participant that created the offer (may be external to BitGo). */
  participantPartyId: string;
  /** Optional comment from the participant. */
  comment?: string;
}

export const CANTON_COMMAND_KEYS = ['CreateCommand', 'ExerciseCommand'] as const;
export type CantonCommandKind = (typeof CANTON_COMMAND_KEYS)[number];

export interface CantonCommandRequest {
  commandId: string;
  actAs: string[];
  readAs?: string[];
  command: CantonCommand;
  resolveContracts?: CantonCommandResolveContractSpec[];
  token?: string;
}

// Root command decoded from the prepared Canton transaction protobuf, used during verifyTransaction.
export interface CantonCommandInfo {
  kind: CantonCommandKind;
  templateId: {
    packageId: string;
    moduleName: string;
    entityName: string;
  };
  argument: unknown;
  choice?: string; // ExerciseCommand only
  contractId?: string; // ExerciseCommand only
  actingParties?: string[]; // ExerciseCommand only
}
