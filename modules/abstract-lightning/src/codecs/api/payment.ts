import * as t from 'io-ts';
import { BigIntFromString } from 'io-ts-types/BigIntFromString';
import { DateFromISOString } from 'io-ts-types/DateFromISOString';
import { LightningPaymentRequest, optionalString } from '@bitgo/public-types';

// codecs for lightning wallet payment related apis

export const PaymentStatus = t.union([
  // Initial state when payment is initiated.
  // Transitions to 'settled' or 'failed' on LND notification.
  t.literal('in_flight'),
  // Final state.
  t.literal('settled'),
  // Final state.
  t.literal('failed'),
]);
export type PaymentStatus = t.TypeOf<typeof PaymentStatus>;

export const PAYMENT_FAILURE_TIMEOUT = 'TIMEOUT';
export const PAYMENT_FAILURE_NO_ROUTE = 'NO_ROUTE';
/** A non-recoverable error */
export const PAYMENT_FAILURE_ERROR = 'ERROR';
export const PAYMENT_FAILURE_INCORRECT_DETAILS = 'INCORRECT_PAYMENT_DETAILS';
/** Insufficient channel outbound capacity */
export const PAYMENT_FAILURE_INSUFFICIENT_CHANNEL_BALANCE = 'INSUFFICIENT_BALANCE';
/** Insufficient custodial lightning balance for the customer's wallet */
export const PAYMENT_FAILURE_INSUFFICIENT_WALLET_BALANCE = 'INSUFFICIENT_WALLET_BALANCE';
/** Excess custodial lightning balance for the customer's wallet */
export const PAYMENT_FAILURE_EXCESS_WALLET_BALANCE = 'EXCESS_WALLET_BALANCE';
export const PAYMENT_FAILURE_INVOICE_EXPIRED = 'INVOICE_EXPIRED';
export const PAYMENT_FAILURE_CANCELED = 'CANCELED';
export const PAYMENT_FAILURE_FORCE_FAILED = 'FORCE_FAILED';

export const PaymentFailureReason = t.union([
  t.literal(PAYMENT_FAILURE_TIMEOUT),
  t.literal(PAYMENT_FAILURE_NO_ROUTE),
  t.literal(PAYMENT_FAILURE_ERROR),
  t.literal(PAYMENT_FAILURE_INCORRECT_DETAILS),
  t.literal(PAYMENT_FAILURE_INSUFFICIENT_CHANNEL_BALANCE),
  t.literal(PAYMENT_FAILURE_INSUFFICIENT_WALLET_BALANCE),
  t.literal(PAYMENT_FAILURE_EXCESS_WALLET_BALANCE),
  t.literal(PAYMENT_FAILURE_INVOICE_EXPIRED),
  t.literal(PAYMENT_FAILURE_CANCELED),
  t.literal(PAYMENT_FAILURE_FORCE_FAILED),
]);

export type PaymentFailureReason = t.TypeOf<typeof PaymentFailureReason>;

/**
 * Off-chain payment information
 */
export const PaymentInfo = t.intersection(
  [
    t.type({
      paymentHash: t.string,
      walletId: t.string,
      txRequestId: t.string,
      status: PaymentStatus,
      invoice: t.string,
      feeLimitMsat: BigIntFromString,
      destination: t.string,
      updatedAt: DateFromISOString,
      createdAt: DateFromISOString,
      amountMsat: BigIntFromString,
    }),
    t.partial({
      feeMsat: BigIntFromString,
      failureReason: PaymentFailureReason,
      paymentPreimage: t.string,
    }),
  ],
  'PaymentInfo'
);

export type PaymentInfo = t.TypeOf<typeof PaymentInfo>;

/**
 * Payment query parameters
 */
export const PaymentQuery = t.partial(
  {
    status: PaymentStatus,
    limit: BigIntFromString,
    startDate: DateFromISOString,
    endDate: DateFromISOString,
  },
  'PaymentQuery'
);
export type PaymentQuery = t.TypeOf<typeof PaymentQuery>;

export const SubmitPaymentParams = t.intersection([
  LightningPaymentRequest,
  t.type({
    passphrase: t.string,
  }),
  t.partial({
    sequenceId: optionalString,
    comment: optionalString,
  }),
]);

export type SubmitPaymentParams = t.TypeOf<typeof SubmitPaymentParams>;

export const LndCreatePaymentResponse = t.intersection(
  [
    t.type({
      status: PaymentStatus,
      paymentHash: t.string,
    }),
    t.partial({
      paymentPreimage: t.string,
      amountMsat: t.string,
      feeMsat: t.string,
      failureReason: PaymentFailureReason,
    }),
  ],
  'LndCreatePaymentResponse'
);

export type LndCreatePaymentResponse = t.TypeOf<typeof LndCreatePaymentResponse>;
