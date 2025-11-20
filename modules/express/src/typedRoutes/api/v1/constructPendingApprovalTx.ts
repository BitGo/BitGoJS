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
  /**
   * The wallet passphrase to decrypt the user key. Required for transactionRequest type approvals
   * if xprv is not provided. Use this to sign the transaction with the wallet's encrypted key.
   */
  walletPassphrase: optional(t.string),
  /**
   * The extended private key in BIP32 format (xprv...). Alternative to walletPassphrase.
   * Required for transactionRequest type approvals if walletPassphrase is not provided.
   */
  xprv: optional(t.string),
  /**
   * Whether to use the original fee from the transaction request. Applies to transactionRequest
   * type approvals only. Cannot be used with fee, feeRate, or feeTxConfirmTarget.
   */
  useOriginalFee: optional(t.boolean),
  /**
   * Custom fee amount in satoshis to use for the transaction. Cannot be used with useOriginalFee.
   */
  fee: optional(t.number),
  /**
   * Custom fee rate in satoshis per kilobyte. Cannot be used with useOriginalFee.
   */
  feeRate: optional(t.number),
  /**
   * Target number of blocks for fee estimation. The fee will be calculated to confirm the
   * transaction within this many blocks. Cannot be used with useOriginalFee.
   */
  feeTxConfirmTarget: optional(t.number),
};

/**
 * Response for constructing a pending approval transaction
 */
export const ConstructPendingApprovalTxResponse = t.type({
  /** The signed transaction in hex-encoded format, ready for broadcast to the network */
  tx: t.string,
  /** The total fee amount in satoshis paid for this transaction (optional) */
  fee: optional(t.number),
  /** The fee rate in satoshis per kilobyte used for this transaction (optional) */
  feeRate: optional(t.number),
  /** Whether this is an instant (RBF-disabled) transaction that cannot be fee-bumped (optional) */
  instant: optional(t.boolean),
  /** BitGo service fee information including amount and address (optional) */
  bitgoFee: optional(t.unknown),
  /** Travel Rule compliance information for regulated transactions (optional) */
  travelInfos: optional(t.unknown),
  /** Estimated size of the transaction in bytes (optional) */
  estimatedSize: optional(t.number),
  /** Array of unspent transaction outputs (UTXOs) used as inputs in this transaction (optional) */
  unspents: optional(t.array(t.unknown)),
});

/**
 * Construct a pending approval transaction
 *
 * Constructs and signs a transaction for a transactionRequest type pending approval without
 * broadcasting it to the network. This allows you to preview and validate the transaction
 * details before final approval.
 *
 * **Important:** This endpoint ONLY works for transactionRequest type pending approvals.
 * Other approval types (e.g., policy changes, user additions) are not supported.
 *
 * **Authentication Requirements:**
 * - You must provide either walletPassphrase or xprv to sign the transaction
 * - The user must have permission to approve the pending approval
 *
 * **Fee Customization:**
 * - `useOriginalFee: true` - Preserves the fee from the original transaction request
 * - Custom fee parameters - Specify fee, feeRate, or feeTxConfirmTarget
 * - Default behavior - If no fee parameters provided, fee is recalculated based on current conditions
 * - Note: Fee parameters cannot be combined with useOriginalFee
 *
 * **Workflow:**
 * 1. Retrieves the pending approval by ID
 * 2. Parses the original transaction to extract recipients
 * 3. Reconstructs the transaction with specified or original fee
 * 4. Signs the transaction with the user's key
 * 5. Returns the signed transaction hex and metadata
 * 6. Transaction is NOT broadcast to the network
 *
 * @operationId express.v1.pendingapproval.constructTx
 * @tag express
 */
export const PutConstructPendingApprovalTx = httpRoute({
  path: '/api/v1/pendingapprovals/{id}/constructTx',
  method: 'PUT',
  request: httpRequest({
    params: ConstructPendingApprovalTxRequestParams,
    body: ConstructPendingApprovalTxRequestBody,
  }),
  response: {
    /** Successfully constructed and signed the transaction. Returns transaction hex and metadata. */
    200: ConstructPendingApprovalTxResponse,
    /**
     * Bad request. Possible reasons:
     * - Invalid pending approval ID
     * - Missing required authentication (walletPassphrase or xprv for transactionRequest)
     * - Invalid fee parameters (e.g., combining useOriginalFee with other fee options)
     * - Incorrect wallet passphrase or xprv
     * - Transaction construction failed
     */
    400: BitgoExpressError,
  },
});
