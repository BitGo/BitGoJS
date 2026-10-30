import type { AttestationPayload } from '@bitgo/public-types';
import { IRequestTracer } from '../../api';

export enum OwnerType {
  WALLET = 'wallet',
  ENTERPRISE = 'enterprise',
}

export enum State {
  PENDING = 'pending',
  AWAITING_SIGNATURE = 'awaitingSignature',
  PENDING_BITGO_ADMIN_APPROVAL = 'pendingBitGoAdminApproval',
  PENDING_ID_VERIFICATION = 'pendingIdVerification',
  PENDING_CUSTODIAN_APPROVAL = 'pendingCustodianApproval',
  PENDING_FINAL_APPROVAL = 'pendingFinalApproval',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  REJECTED = 'rejected',
}

export enum Type {
  USER_CHANGE_REQUEST = 'userChangeRequest',
  TRANSACTION_REQUEST = 'transactionRequest',
  POLICY_RULE_REQUEST = 'policyRuleRequest',
  UPDATE_APPROVALS_REQUIRED_REQUEST = 'updateApprovalsRequiredRequest',
  TRANSACTION_REQUEST_FULL = 'transactionRequestFull',
}

export interface ApproveOptions {
  walletPassphrase?: string;
  otp?: string;
  /** WebAuthn proof that the approver authorized the pending transaction intent. */
  attestation?: AttestationPayload;
  tx?: string;
  xprv?: string;
  previewPendingTxs?: boolean;
  pendingApprovalId?: string;
}

export interface PendingApprovalInfo {
  type: Type;
  transactionRequest?: {
    coinSpecific: { [key: string]: any };
    recipients: any;
    buildParams: {
      type?: 'fanout' | 'consolidate' | 'enabletoken' | 'wrapApprove' | 'wrap' | 'unwrap' | 'finalizeUnwrap';
      [index: string]: any;
    };
    sourceWallet?: string;
  };
  /**
   * Present on transactionRequestFull pending approvals. intent.intentType is
   * MESSAGE_SIGNING_INTENT_TYPES for message-sign approvals, which have no
   * unsigned transaction.
   */
  transactionRequestFull?: {
    txRequestId?: string;
    intent?: {
      intentType?: string;
      [index: string]: unknown;
    };
    [index: string]: unknown;
  };
}

/** Intent types whose txRequest carries a message to sign rather than a transaction. */
export const MESSAGE_SIGNING_INTENT_TYPES: ReadonlySet<string> = new Set(['signMessage', 'signTypedStructuredData']);

export interface PendingApprovalData {
  id: string;
  wallet?: string;
  enterprise?: string;
  state: State;
  creator: string;
  info: PendingApprovalInfo;
  approvalsRequired?: number;
  txRequestId?: string;
}

export interface IPendingApproval {
  id(): string;
  toJSON(): PendingApprovalData;
  ownerType(): OwnerType;
  walletId(): string | undefined;
  enterpriseId(): string | undefined;
  state(): State;
  creator(): string;
  type(): Type;
  info(): PendingApprovalInfo;
  approvalsRequired(): number;
  url(extra?: string): string;
  get(params?: Record<string, never>): Promise<IPendingApproval>;
  approve(params?: ApproveOptions): Promise<any>;
  reject(params?: Record<string, never>): Promise<any>;
  cancel(params?: Record<string, never>): Promise<any>;
  recreateAndSignTSSTransaction(params: ApproveOptions, reqId: IRequestTracer): Promise<{ txHex: string }>;
  recreateAndSignTransaction(params?: any): Promise<any>;
}
