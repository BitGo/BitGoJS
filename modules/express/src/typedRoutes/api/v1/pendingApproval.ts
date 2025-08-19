import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const pendingApprovalRequestParams = {
  id: t.string,
};

export const pendingApprovalRequestBody = {
  walletPassphrase: optional(t.string),
  otp: optional(t.string),
  tx: optional(t.string),
  xprv: optional(t.string),
  previewPendingTxs: optional(t.boolean),
  pendingApprovalId: optional(t.string),
};

/**
 * Pending approval request
 *
 * @operationId express.v1.pendingapprovals
 */

export const PutPendingApproval = httpRoute({
  path: '/api/v1/pendingapprovals/:id/express',
  method: 'PUT',
  request: httpRequest({
    params: pendingApprovalRequestParams,
    body: pendingApprovalRequestBody,
  }),
  response: {
    200: t.UnknownRecord,
    400: BitgoExpressError,
  },
});
