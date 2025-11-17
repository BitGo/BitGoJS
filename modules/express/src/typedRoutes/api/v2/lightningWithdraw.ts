import * as t from 'io-ts';
import { BigIntFromString } from 'io-ts-types';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for lightning withdraw
 */
export const LightningWithdrawParams = {
  /** The coin identifier (e.g., 'lnbtc', 'tlnbtc') */
  coin: t.string,
  /** The ID of the wallet */
  id: t.string,
} as const;

/**
 * Lightning onchain recipient
 */
const LightningOnchainRecipient = t.type({
  /** Amount in satoshis (as string that will be converted to BigInt) */
  amountSat: BigIntFromString,
  /** Bitcoin address to send to */
  address: t.string,
});

/**
 * Request body for lightning onchain withdrawal
 */
export const LightningWithdrawRequestBody = {
  /** Array of recipients to pay */
  recipients: t.array(LightningOnchainRecipient),
  /** Wallet passphrase for signing */
  passphrase: t.string,
  /** Fee rate in satoshis per virtual byte (as string that will be converted to BigInt) */
  satsPerVbyte: optional(BigIntFromString),
  /** Target number of blocks for confirmation */
  numBlocks: optional(t.number),
  /** Optional sequence ID for the withdraw transfer */
  sequenceId: optional(t.string),
  /** Optional comment for the withdraw transfer */
  comment: optional(t.string),
} as const;

/**
 * Withdraw status codec
 */
const WithdrawStatus = t.union([t.literal('delivered'), t.literal('failed')]);

/**
 * LND create withdraw response
 */
const LndCreateWithdrawResponse = t.intersection([
  t.type({
    /** Status of the withdrawal */
    status: WithdrawStatus,
  }),
  t.partial({
    /** Transaction ID (txid) if delivered */
    txid: t.string,
    /** Failure reason if failed */
    failureReason: t.string,
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
 * Transaction request details in pending approval info
 * When transactionRequest is present, coinSpecific, recipients, and buildParams are REQUIRED
 * Only sourceWallet is optional
 */
const TransactionRequestDetails = t.intersection([
  t.type({
    /** Coin-specific transaction details - REQUIRED */
    coinSpecific: t.record(t.string, t.unknown),
    /** Recipients of the transaction - REQUIRED */
    recipients: t.unknown,
    /** Build parameters for the transaction - REQUIRED */
    buildParams: t.intersection([
      t.partial({
        /** Type of transaction (fanout or consolidate) - OPTIONAL */
        type: t.union([t.literal('fanout'), t.literal('consolidate')]),
      }),
      t.record(t.string, t.unknown),
    ]),
  }),
  t.partial({
    /** Source wallet for the transaction - OPTIONAL */
    sourceWallet: t.string,
  }),
]);

/**
 * Pending approval info nested object
 */
const PendingApprovalInfo = t.intersection([
  t.type({
    /** Type of pending approval */
    type: PendingApprovalType,
  }),
  t.partial({
    /** Transaction request associated with approval */
    transactionRequest: TransactionRequestDetails,
  }),
]);

/**
 * Pending approval data
 */
const PendingApproval = t.intersection([
  t.type({
    /** Pending approval ID */
    id: t.string,
    /** State of the pending approval */
    state: PendingApprovalState,
    /** Creator of the pending approval */
    creator: t.string,
    /** Information about the pending approval */
    info: PendingApprovalInfo,
  }),
  t.partial({
    /** Wallet ID if wallet-specific */
    wallet: t.string,
    /** Enterprise ID if enterprise-specific */
    enterprise: t.string,
    /** Number of approvals required */
    approvalsRequired: t.number,
    /** Associated transaction request ID */
    txRequestId: t.string,
  }),
]);

/**
 * Response for lightning onchain withdrawal
 */
const LightningWithdrawResponse = t.intersection([
  t.type({
    /** Unique identifier for withdraw request submitted to BitGo */
    txRequestId: t.string,
    /** Status of withdraw request submission to BitGo */
    txRequestState: TxRequestState,
  }),
  t.partial({
    /** Pending approval details, if applicable */
    pendingApproval: PendingApproval,
    /** Current snapshot of withdraw status (if available) */
    withdrawStatus: LndCreateWithdrawResponse,
  }),
]);

/**
 * Response type mapping for lightning withdraw
 */
export const LightningWithdrawResponseType = {
  200: LightningWithdrawResponse,
  400: BitgoExpressError,
  401: BitgoExpressError,
  404: BitgoExpressError,
  500: BitgoExpressError,
} as const;

/**
 * Lightning Onchain Withdrawal API
 *
 * Withdraws lightning balance to an onchain Bitcoin address
 *
 * @operationId express.v2.wallet.lightningWithdraw
 * @tag express
 */
export const PostLightningWalletWithdraw = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/lightning/withdraw',
  method: 'POST',
  request: httpRequest({
    params: LightningWithdrawParams,
    body: LightningWithdrawRequestBody,
  }),
  response: LightningWithdrawResponseType,
});
