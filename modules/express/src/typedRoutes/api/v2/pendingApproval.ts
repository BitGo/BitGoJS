import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for pending approval endpoint
 */
export const PendingApprovalParams = {
  /** Coin identifier (e.g., 'btc', 'eth', 'tbtc') */
  coin: t.string,
  /** Pending approval ID */
  id: t.string,
} as const;

/**
 * Approve or reject a pending approval with optional signing credentials.
 * State, wallet passphrase, OTP, or pre-signed transaction hex.
 */
export const PendingApprovalRequestBody = {
  /** State of the approval: 'approved' to approve, omit or 'rejected' to reject */
  state: optional(t.string),
  /** Wallet passphrase for decrypting user keys during transaction signing */
  walletPassphrase: optional(t.string),
  /** One-time password for 2FA verification */
  otp: optional(t.string),
  /** Transaction hex to use instead of the original transaction */
  tx: optional(t.string),
  /** Private key in string form as an alternative to wallet passphrase */
  xprv: optional(t.string),
  /** If true, returns information about pending transactions without approving */
  previewPendingTxs: optional(t.boolean),
  /** Alternative ID for the pending approval */
  pendingApprovalId: optional(t.string),
} as const;

/**
 * Pending approval state enum
 */
export const PendingApprovalState = t.union([
  t.literal('pending'),
  t.literal('awaitingSignature'),
  t.literal('pendingBitGoAdminApproval'),
  t.literal('pendingIdVerification'),
  t.literal('pendingCustodianApproval'),
  t.literal('pendingFinalApproval'),
  t.literal('approved'),
  t.literal('processing'),
  t.literal('rejected'),
]);

/**
 * Pending approval type enum
 */
export const PendingApprovalType = t.union([
  t.literal('userChangeRequest'),
  t.literal('transactionRequest'),
  t.literal('policyRuleRequest'),
  t.literal('updateApprovalsRequiredRequest'),
  t.literal('transactionRequestFull'),
]);

/**
 * Build parameters for transaction request
 * Allows any additional properties beyond the known 'type' field
 */
export const BuildParams = t.intersection([
  t.partial({
    /** Transaction type (e.g., fanout, consolidate) */
    type: t.union([t.literal('fanout'), t.literal('consolidate')]),
  }),
  t.UnknownRecord,
]);

/**
 * Transaction request info within pending approval
 */
export const TransactionRequestInfo = t.intersection([
  t.type({
    /** Coin-specific transaction parameters */
    coinSpecific: t.UnknownRecord,
    /** Transaction recipients */
    recipients: t.unknown,
    /** Build parameters for the transaction */
    buildParams: BuildParams,
  }),
  t.partial({
    /** Source wallet ID for the transaction */
    sourceWallet: t.string,
  }),
]);

/**
 * Pending approval information structure
 */
export const PendingApprovalInfo = t.intersection([
  t.type({
    /** Type of pending approval */
    type: PendingApprovalType,
  }),
  t.partial({
    /** Transaction request details (if type is transactionRequest) */
    transactionRequest: TransactionRequestInfo,
  }),
]);

/**
 * Pending approval data response
 * Both approve and reject return the same structure
 */
export const PendingApprovalResponse = t.intersection([
  t.type({
    /** Pending approval unique identifier */
    id: t.string,
    /** Current state of the pending approval */
    state: PendingApprovalState,
    /** User ID of the pending approval creator */
    creator: t.string,
    /** Pending approval information and details */
    info: PendingApprovalInfo,
  }),
  t.partial({
    /** Wallet ID if this is a wallet-level approval */
    wallet: t.string,
    /** Enterprise ID if this is an enterprise-level approval */
    enterprise: t.string,
    /** Number of approvals required for this pending approval */
    approvalsRequired: t.number,
    /** Transaction request ID associated with this pending approval */
    txRequestId: t.string,
  }),
]);

/**
 * Update Pending Approval
 * Approve or reject a pending approval by its ID.
 * Supports transaction approvals, policy rule changes, and user change requests.
 *
 * @operationId express.v2.pendingapprovals
 * @tag express
 */
export const PutV2PendingApproval = httpRoute({
  path: '/api/v2/{coin}/pendingapprovals/{id}',
  method: 'PUT',
  request: httpRequest({
    params: PendingApprovalParams,
    body: PendingApprovalRequestBody,
  }),
  response: {
    /** Successfully updated pending approval */
    200: PendingApprovalResponse,
    /** Bad request or validation error */
    400: BitgoExpressError,
  },
});
