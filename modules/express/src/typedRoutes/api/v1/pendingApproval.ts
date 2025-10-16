import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const pendingApprovalRequestParams = {
  /** ID of the pending approval to update */
  id: t.string,
};

export const pendingApprovalRequestBody = {
  /** Wallet passphrase for decrypting user keys (required for transaction signing) */
  walletPassphrase: optional(t.string),
  /** One-time password for 2FA verification */
  otp: optional(t.string),
  /** Transaction hex to use instead of the original transaction */
  tx: optional(t.string),
  /** Private key in string form (as an alternative to wallet passphrase) */
  xprv: optional(t.string),
  /** If true, returns information about pending transactions without approving */
  previewPendingTxs: optional(t.boolean),
  /** Alternative ID for the pending approval */
  pendingApprovalId: optional(t.string),
};

/**
 * Pending Approval Request
 * Approve or reject a pending approval by its ID.
 * Handles various approval scenarios including transaction approvals, policy rule changes,
 * and user change requests.
 *
 * @tag express
 * @operationId express.v1.pendingapprovals
 */

export const PutPendingApproval = httpRoute({
  path: '/api/v1/pendingapprovals/{id}/express',
  method: 'PUT',
  request: httpRequest({
    params: pendingApprovalRequestParams,
    body: pendingApprovalRequestBody,
  }),
  response: {
    /** Successfully updated pending approval */
    200: t.UnknownRecord,
    /** Error response */
    400: BitgoExpressError,
  },
});
