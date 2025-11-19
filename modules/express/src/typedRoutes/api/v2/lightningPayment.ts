import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BigIntFromString } from 'io-ts-types';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for lightning payment API
 */
export const LightningPaymentParams = {
  /** The coin identifier (e.g., 'tlnbtc', 'lnbtc') */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Request body for paying a lightning invoice
 */
export const LightningPaymentRequestBody = {
  /** The BOLT #11 encoded lightning invoice to pay */
  invoice: t.string,
  /** The wallet passphrase to decrypt signing keys */
  passphrase: t.string,
  /** Amount to pay in millisatoshis (required for zero-amount invoices) */
  amountMsat: optional(BigIntFromString),
  /** Maximum fee limit in millisatoshis */
  feeLimitMsat: optional(BigIntFromString),
  /** Fee limit as a ratio of payment amount (e.g., 0.01 for 1%) */
  feeLimitRatio: optional(t.number),
  /** Custom sequence ID for tracking this payment */
  sequenceId: optional(t.string),
  /** Comment or memo for this payment (not sent to recipient) */
  comment: optional(t.string),
} as const;

/**
 * Payment status on the Lightning Network
 */
const PaymentStatus = t.union([t.literal('in_flight'), t.literal('settled'), t.literal('failed')]);

/**
 * Payment failure reasons
 */
const PaymentFailureReason = t.union([
  t.literal('TIMEOUT'),
  t.literal('NO_ROUTE'),
  t.literal('ERROR'),
  t.literal('INCORRECT_PAYMENT_DETAILS'),
  t.literal('INSUFFICIENT_BALANCE'),
  t.literal('INSUFFICIENT_WALLET_BALANCE'),
  t.literal('EXCESS_WALLET_BALANCE'),
  t.literal('INVOICE_EXPIRED'),
  t.literal('PAYMENT_ALREADY_SETTLED'),
  t.literal('PAYMENT_ALREADY_IN_FLIGHT'),
  t.literal('TRANSIENT_ERROR_RETRY_LATER'),
  t.literal('CANCELED'),
  t.literal('FORCE_FAILED'),
]);

/**
 * Lightning Network payment status details
 */
const LndCreatePaymentResponse = t.intersection([
  t.type({
    /** Current payment status */
    status: PaymentStatus,
    /** Payment hash identifying this payment */
    paymentHash: t.string,
  }),
  t.partial({
    /** Internal BitGo payment ID */
    paymentId: t.string,
    /** Payment preimage (present when settled) */
    paymentPreimage: t.string,
    /** Actual amount paid in millisatoshis */
    amountMsat: t.string,
    /** Actual fee paid in millisatoshis */
    feeMsat: t.string,
    /** Failure reason (present when failed) */
    failureReason: PaymentFailureReason,
  }),
]);

/**
 * Transaction request state
 */
const TxRequestState = t.union([
  t.literal('pendingCommitment'),
  t.literal('pendingApproval'),
  t.literal('canceled'),
  t.literal('rejected'),
  t.literal('initialized'),
  t.literal('pendingDelivery'),
  t.literal('delivered'),
  t.literal('pendingUserSignature'),
  t.literal('signed'),
]);

/**
 * Pending approval state
 */
const PendingApprovalState = t.union([
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
 * Pending approval type
 */
const PendingApprovalType = t.union([
  t.literal('userChangeRequest'),
  t.literal('transactionRequest'),
  t.literal('policyRuleRequest'),
  t.literal('updateApprovalsRequiredRequest'),
  t.literal('transactionRequestFull'),
]);

/**
 * Transaction request details within pending approval info
 */
const TransactionRequestDetails = t.intersection([
  t.type({
    /** Coin-specific transaction details */
    coinSpecific: t.record(t.string, t.unknown),
    /** Recipients of the transaction */
    recipients: t.unknown,
    /** Build parameters for the transaction */
    buildParams: t.intersection([
      t.partial({
        /** Type of transaction */
        type: t.union([t.literal('fanout'), t.literal('consolidate')]),
      }),
      t.record(t.string, t.unknown),
    ]),
  }),
  t.partial({
    /** Source wallet for the transaction */
    sourceWallet: t.string,
  }),
]);

/**
 * Pending approval information
 */
const PendingApprovalInfo = t.intersection([
  t.type({
    /** Type of pending approval */
    type: PendingApprovalType,
  }),
  t.partial({
    /** Transaction request details (for transaction-related approvals) */
    transactionRequest: TransactionRequestDetails,
  }),
]);

/**
 * Pending approval details
 */
const PendingApproval = t.intersection([
  t.type({
    /** Pending approval ID */
    id: t.string,
    /** Approval state */
    state: PendingApprovalState,
    /** User ID of the approval creator */
    creator: t.string,
    /** Pending approval information */
    info: PendingApprovalInfo,
  }),
  t.partial({
    /** Wallet ID (for wallet-level approvals) */
    wallet: t.string,
    /** Enterprise ID (for enterprise-level approvals) */
    enterprise: t.string,
    /** Number of approvals required */
    approvalsRequired: t.number,
    /** Associated transaction request ID */
    txRequestId: t.string,
  }),
]);

/**
 * Response for paying a lightning invoice
 */
export const LightningPaymentResponse = t.intersection([
  t.type({
    /** Payment request ID for tracking */
    txRequestId: t.string,
    /** Status of the payment request ('delivered', 'pendingApproval', etc.) */
    txRequestState: TxRequestState,
  }),
  t.partial({
    /** Pending approval details (present when approval is required) */
    pendingApproval: PendingApproval,
    /** Payment status on the Lightning Network (absent when pending approval) */
    paymentStatus: LndCreatePaymentResponse,
  }),
]);

/**
 * Response status codes
 */
export const LightningPaymentResponseObj = {
  /** Successfully submitted payment */
  200: LightningPaymentResponse,
  /** Invalid request */
  400: BitgoExpressError,
} as const;

/**
 * Pay a Lightning Invoice
 *
 * Submits a payment for a BOLT #11 lightning invoice. The payment is signed with the user's
 * authentication key and submitted to BitGo. If the payment requires additional approvals
 * (based on wallet policy), returns pending approval details. Otherwise, the payment is
 * immediately submitted to the Lightning Network.
 *
 * Fee limits can be controlled using either `feeLimitMsat` (absolute limit) or `feeLimitRatio`
 * (as a ratio of payment amount). If both are provided, the more restrictive limit applies.
 *
 * For zero-amount invoices (invoices without a specified amount), the `amountMsat` field is required.
 *
 * @operationId express.v2.wallet.lightningPayment
 * @tag express
 */
export const PostLightningWalletPayment = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/lightning/payment',
  method: 'POST',
  request: httpRequest({
    params: LightningPaymentParams,
    body: LightningPaymentRequestBody,
  }),
  response: LightningPaymentResponseObj,
});
