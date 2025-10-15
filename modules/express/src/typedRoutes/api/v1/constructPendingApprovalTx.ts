import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for constructing a pending approval transaction
 */
export const ConstructPendingApprovalTxRequestParams = {
  /** The ID of the pending approval */
  id: t.string,
};

/**
 * Request body for constructing a pending approval transaction
 */
export const ConstructPendingApprovalTxRequestBody = {
  /** The wallet passphrase to decrypt the user key (either walletPassphrase or xprv must be provided for transactionRequest type) */
  walletPassphrase: optional(t.string),
  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** Whether to use the original fee from the transaction request (cannot be used with fee, feeRate, or feeTxConfirmTarget) */
  useOriginalFee: optional(t.boolean),
  /** Custom fee amount in satoshis (cannot be used with useOriginalFee) */
  fee: optional(t.number),
  /** Custom fee rate in satoshis per kilobyte (cannot be used with useOriginalFee) */
  feeRate: optional(t.number),
  /** Custom fee confirmation target in blocks (cannot be used with useOriginalFee) */
  feeTxConfirmTarget: optional(t.number),
};

/**
 * Response for constructing a pending approval transaction
 */
export const ConstructPendingApprovalTxResponse = t.type({
  /** The signed transaction hex */
  tx: t.string,
  /** The fee amount in satoshis */
  fee: optional(t.number),
  /** The fee rate in satoshis per kilobyte */
  feeRate: optional(t.number),
  /** Whether the transaction is instant */
  instant: optional(t.boolean),
  /** The BitGo fee amount */
  bitgoFee: optional(t.unknown),
  /** Travel information */
  travelInfos: optional(t.unknown),
  /** Estimated transaction size in bytes */
  estimatedSize: optional(t.number),
  /** Unspent transaction outputs used */
  unspents: optional(t.array(t.unknown)),
});

/**
 * Construct a pending approval transaction
 *
 * This endpoint constructs and signs a transaction for a pending approval, returning the transaction hex
 * but not sending it to the network. This is useful for reviewing the transaction before approving it.
 *
 * For transaction request type approvals, either a wallet passphrase or xprv must be provided to sign the transaction.
 * You can optionally specify fee-related parameters to customize the transaction fee.
 *
 * @tag express
 * @operationId express.v1.pendingapproval.constructTx
 */
export const PutConstructPendingApprovalTx = httpRoute({
  path: '/api/v1/pendingapprovals/:id/constructTx',
  method: 'PUT',
  request: httpRequest({
    params: ConstructPendingApprovalTxRequestParams,
    body: ConstructPendingApprovalTxRequestBody,
  }),
  response: {
    /** Successfully constructed transaction */
    200: ConstructPendingApprovalTxResponse,
    /** Invalid request or construction fails */
    400: BitgoExpressError,
  },
});
