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
  broadridge?: BroadridgeProtocolDescriptor;
  broadridgeAllocationRequestData?: BroadridgeAllocationRequestData;
  broadridgeSettlementAuthorizationData?: BroadridgeSettlementAuthorizationData;
}
export interface CantonCommandExplain {
  kind: CantonCommandKind;
  templateId: string;
  actAs: string[];
  choice?: string;
  contractId?: string;
  broadridge?: BroadridgeProtocolDescriptor;
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
  broadridgeAllocationRequestData?: BroadridgeAllocationRequestData;
  broadridgeSettlementAuthorizationData?: BroadridgeSettlementAuthorizationData;
  endInvestorOnboardingOfferData?: EndInvestorOnboardingOfferData;
  memoId?: string;
  token?: string;
  cantonCommand?: CantonCommandExplain;
  broadridge?: BroadridgeProtocolDescriptor;
}
export interface PreparedTxnParsedInfo {
  sender: string;
  receiver: string;
  amount: string;
  memoId?: string;
  token?: string;
  broadridgeAllocationRequestData?: BroadridgeAllocationRequestData;
  broadridgeSettlementAuthorizationData?: BroadridgeSettlementAuthorizationData;
}

export interface BroadridgeSettlementIdentity {
  executor?: string;
  executors?: string[];
  id?: string;
  cid?: string;
  requestedAt?: string;
  allocateBefore?: string;
  settleBefore?: string;
  settleAt?: string;
  meta?: unknown;
}

export interface BroadridgeAllocationLeg {
  legId?: string;
  side?: 'SenderSide' | 'ReceiverSide' | string;
  senderPartyId?: string;
  receiverPartyId?: string;
  amount?: CantonAmount;
  instrumentId?: string;
  instrumentAdmin?: string;
  meta?: unknown;
  [key: string]: unknown;
}
export interface BroadridgeAllocationSpecification {
  admin?: string;
  authorizer?: {
    owner?: string;
    provider?: string;
    id?: string;
    [key: string]: unknown;
  };
  transferLegSides?: BroadridgeAllocationLeg[];
  receiverOnly?: boolean;
  inputHoldingCids?: string[];
  deadline?: string;
  committed?: boolean;
  nextIterationFunding?: unknown;
  meta?: unknown;
  [key: string]: unknown;
}

export interface BroadridgeAllocationRequestData {
  version: 'v1' | 'v2';
  templateId: string;
  requestCid?: string;
  executor?: string;
  settlement?: BroadridgeSettlementIdentity;
  transferLegs?: BroadridgeAllocationLeg[];
  allocations?: BroadridgeAllocationSpecification[];
  requestedAt?: string;
  settleAt?: string;
  meta?: unknown;
  originalRequestCid?: string;
  outcome?: BroadridgeAllocationRequestOutcome;
  raw: Record<string, unknown>;
}

export type BroadridgeAllocationRequestOutcome = {
  choice: 'AllocationRequest_Accept' | 'AllocationRequest_Reject' | 'AllocationRequest_Withdraw' | 'Archive';
  requestCid?: string;
  actors: string[];
  meta?: unknown;
  result?: unknown;
  status: 'accepted' | 'rejected' | 'withdrawn' | 'archived';
};

export interface BroadridgeProtocolDescriptor {
  protocol: 'broadridge';
  standard: 'CIP-56' | 'CIP-112';
  packageId: string;
  moduleName: string;
  entityName: string;
  templateId: string;
  choice?: string;
  role: 'client' | 'executor' | 'trading-party' | 'agreement' | 'request' | 'allocation';
  actors: string[];
  client?: string;
  executor?: string;
  contractId?: string;
  requestCid?: string;
  agreementCid?: string;
  settlement?: BroadridgeSettlementIdentity;
  allocationCids?: string[];
  reason?: unknown;
  result?: unknown;
}

export interface BroadridgeSettlementAuthorizationData {
  descriptor: BroadridgeProtocolDescriptor;
  client?: string;
  executor?: string;
  tradingParties?: string[];
  approvers?: string[];
  settlement?: BroadridgeSettlementIdentity;
  delegationCid?: string;
  proposalCid?: string;
  agreementCid?: string;
  allocationCids?: string[];
  meta?: unknown;
  reason?: unknown;
  result?: unknown;
}

export interface BroadridgeCommandParams {
  descriptor: BroadridgeProtocolDescriptor;
  /** Optional command argument subset to compare after descriptor checks. */
  argument?: unknown;
}

export interface BroadridgeCommandRequest extends CantonCommandRequest {
  broadridge?: BroadridgeProtocolDescriptor;
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

export interface CantonMinLedgerTime {
  time: { Empty: Record<string, never> } | { MinLedgerTimeAbs: { value: string } };
}

export interface CantonCustodialTiming {
  minLedgerTime: { time: { MinLedgerTimeAbs: { value: string } } };
  broadcastNotBefore: string;
  broadcastTarget: string;
  broadcastExpiresAt: string;
}

export interface CantonPrepareCommandResponse {
  preparedTransaction?: string;
  preparedTransactionHash: string;
  hashingSchemeVersion: string;
  hashingDetails?: string | null;
  utxoInfo?: UTXOInfo[];
  isOneStepTransfer?: boolean;
  custodialTiming?: CantonCustodialTiming;
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
  broadridge?: BroadridgeProtocolDescriptor;
  prepareCommandResponse?: CantonPrepareCommandResponse;
  preparedTransaction?: string;
  txType: string;
  partySignatures?: {
    signatures: PartySignature[];
  };
  deduplicationPeriod?: {
    Empty: Record<string, never>;
  };
  submissionId: string;
  hashingSchemeVersion?: string;
  minLedgerTime?: CantonMinLedgerTime;
}

export interface CantonOneStepEnablementRequest extends CantonPrepareCommandRequest {
  receiverId: string;
  tokenName?: string;
}

/**
 * Request to revert an active 1-step TransferPreapproval back to 2-step approval (exercises
 * TransferPreapproval_Cancel on Splice.AmuletRules:TransferPreapproval). Mirrors
 * CantonOneStepEnablementRequest's shape — same receiverId/tokenName fields, opposite direction.
 */
export interface CantonTransferPreapprovalCancelRequest extends CantonPrepareCommandRequest {
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

export type CantonAmount = number | string;
export type CantonAmountInput = CantonAmount | bigint;

export interface TransferAcknowledge {
  contractId: string;
  senderPartyId: string;
  amount: CantonAmount;
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
  amount: CantonAmount;
  expiryEpoch: number;
  sendViaOneStep: boolean;
  memoId?: string;
  tokenName?: string;
}

export interface CantonAllocationAllocateRequest {
  commandId: string;
  amount: CantonAmount;
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
  /** 'receive' marks an unfunded, receive-only V2 allocation (amount 0, nothing locked). Absent means send. */
  allocationRole?: 'send' | 'receive';
}

/**
 * Internal (non-signable) data for an AllocationRequest txRequest.
 * Surfaces the full DvP trade leg to the allocating party so they can
 * review and then submit an AllocationAllocate.
 *
 * For a trade leg (`legType` "trade", or absent for legacy requests),
 * `receiveToken`/`receiveAmount` show what the allocating party will receive
 * upon successful settlement. A fee leg (`legType` "fee") is payment-only —
 * the fee payer sends the operator fee and receives nothing — so the receive
 * fields are absent and `parentTradeId` carries the trade identifier of the
 * parent trade the fee belongs to.
 */
export interface AllocationRequest {
  updateId: string;
  operatorId: string;
  contractId?: string;
  tradeId: string;
  transferLegId: string;
  senderPartyId: string;
  receiverPartyId: string;
  amount: CantonAmount;
  token: string;
  receiveToken?: string;
  receiveAmount?: CantonAmount;
  legType?: 'trade' | 'fee';
  parentTradeId?: string;
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
export interface CantonAllowListCommandParams {
  /** Fully-qualified V3 ParticipantService template ID, including package reference. */
  templateId: string;
  /** ParticipantService contract being exercised. */
  participantServiceCid: string;
  /** Participant-owned AllowList contract passed to the choice. */
  allowListCid: string;
  /** End-investor Credential contracts. Empty is valid and preserves DAR no-op semantics. */
  credentialCids: string[];
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
  actingParties?: string[]; // Submitter actAs for CreateCommand; root acting parties for ExerciseCommand
}
