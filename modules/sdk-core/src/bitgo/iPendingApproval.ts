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
}

export interface PendingApprovalInfo {
  type: Type;
  transactionRequest?: {
    coinSpecific: { [key: string]: any };
    recipients: any;
    buildParams: {
      type?: 'fanout' | 'consolidate';
      [index: string]: any;
    };
    sourceWallet?: string;
  };
}

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
  placehold: unknown;
}
