import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const pendingApprovalRequestParams = {
  /** ID of the pending approval to update */
  id: t.string,
};

/**
 * Approve or reject a pending approval.
 * State, wallet passphrase for signing, OTP, or pre-signed transaction.
 */
export const pendingApprovalRequestBody = {
  /** State of the approval: 'approved' to approve, any other value or omit to reject (defaults to rejection) */
  state: optional(t.string),
  /** Wallet passphrase for transaction signing (required for transactionRequest approvals unless tx or xprv provided) */
  walletPassphrase: optional(t.string),
  /** One-time password for 2FA verification */
  otp: optional(t.string),
  /** Pre-signed transaction hex to use instead of reconstructing (for transactionRequest approvals) */
  tx: optional(t.string),
  /** Extended private key as alternative to walletPassphrase (for transactionRequest approvals) */
  xprv: optional(t.string),
  /** If true, returns information about pending transactions without approving (unused in V1) */
  previewPendingTxs: optional(t.boolean),
  /** Alternative ID for the pending approval (unused in V1) */
  pendingApprovalId: optional(t.string),
};

/**
 * Approve or reject a pending approval
 *
 * Updates the state of a pending approval to either 'approved' or 'rejected' based on the
 * state parameter. If state is 'approved', the approval is approved; otherwise, it is rejected.
 * Default behavior (when state is omitted) is rejection.
 *
 * **Approval Types:**
 * - **transactionRequest**: Transaction approvals (may require walletPassphrase for signing)
 * - **policyRuleRequest**: Policy changes (no transaction signing needed)
 * - **tagUpdateRequest**: Tag updates
 * - Other types: User changes, enterprise updates, etc.
 *
 * **Transaction Approval Behavior (transactionRequest type):**
 * - If `tx` provided: Uses the provided transaction hex directly
 * - If `walletPassphrase` or `xprv` provided: Reconstructs and signs transaction with current unspents
 * - If neither provided: Uses original transaction (works for sweeps and view-only approvers)
 * - Automatically retries with reconstruction if unspents expire during approval
 *
 * **Multi-Approval Wallets:**
 * If approvalsRequired > 1, the state may be 'pending' after approval (not 'approved' until
 * all required approvals are received).
 *
 * **Response:** Returns the updated pending approval object including:
 * - id: Pending approval ID
 * - state: Current state ('approved', 'rejected', 'pending', or 'canceled')
 * - info: Approval-specific information (transactionRequest, policyRuleRequest, etc.)
 * - walletId: Wallet ID (if wallet-owned)
 * - enterprise: Enterprise ID (if enterprise-owned)
 * - creator: User ID who created the approval
 * - approvalsRequired: Number of approvals needed (for multi-approval wallets)
 *
 * @operationId express.v1.pendingapprovals
 * @tag express
 */

export const PutPendingApproval = httpRoute({
  path: '/api/v1/pendingapprovals/{id}/express',
  method: 'PUT',
  request: httpRequest({
    params: pendingApprovalRequestParams,
    body: pendingApprovalRequestBody,
  }),
  response: {
    /** Successfully updated pending approval. Returns the updated pending approval object with new state and info. */
    200: t.UnknownRecord,
    /** Error response (e.g., invalid ID, insufficient permissions, missing authentication, unspents expired without passphrase) */
    400: BitgoExpressError,
  },
});
