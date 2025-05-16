import * as t from 'io-ts';
import { BigIntFromString } from 'io-ts-types/BigIntFromString';
import { DateFromISOString } from 'io-ts-types/DateFromISOString';

// codecs for lightning wallet invoice related apis

export const InvoiceStatus = t.union(
  [
    // Initial state.
    // Transitions to 'settled' or 'canceled' on LND notification.
    t.literal('open'),
    // Final state.
    t.literal('settled'),
    // Final state.
    t.literal('canceled'),
  ],
  'InvoiceStatus'
);
export type InvoiceStatus = t.TypeOf<typeof InvoiceStatus>;

export const CreateInvoiceBody = t.intersection(
  [
    t.type({
      valueMsat: BigIntFromString,
    }),
    t.partial({
      memo: t.string,
      expiry: t.number,
    }),
  ],
  'CreateInvoiceBody'
);
export type CreateInvoiceBody = t.TypeOf<typeof CreateInvoiceBody>;

/**
 * A representation of the data tracked by the indexer for an invoice it has
 * created within lnd.
 */
export const Invoice = t.intersection(
  [
    t.type({
      valueMsat: BigIntFromString,
      paymentHash: t.string,
      /** The BOLT #11 encoded invoice string */
      invoice: t.string,
      /** The public BitGo walletId to which this invoice belongs */
      walletId: t.string,
      status: InvoiceStatus,
      /** A date in ISO format representing when this invoice expires. */
      expiresAt: DateFromISOString,
    }),
    t.partial({
      memo: t.string,
    }),
  ],
  'Invoice'
);
export type Invoice = t.TypeOf<typeof Invoice>;

export const InvoiceInfo = t.intersection(
  [
    t.type({
      valueMsat: BigIntFromString,
      paymentHash: t.string,
      invoice: t.string,
      walletId: t.string,
      status: InvoiceStatus,
      expiresAt: DateFromISOString,
      createdAt: DateFromISOString,
      updatedAt: DateFromISOString,
    }),
    t.partial({
      /**
       * The number of millisats actually paid to this invoice, this may be greater
       * than the amount requested by the invoice, since lightning allows overpaying
       * (but not underpaying) invoices.
       */
      amtPaidMsat: BigIntFromString,
    }),
  ],
  'InvoiceInfo'
);
export type InvoiceInfo = t.TypeOf<typeof InvoiceInfo>;

export const ListInvoicesResponse = t.intersection(
  [
    t.type({
      invoices: t.array(InvoiceInfo),
    }),
    t.partial({
      /**
       * This is the paymentHash of the last Invoice in the last iteration.
       * Providing this value as the prevId in the next request will return the next batch of invoices.
       * */
      nextBatchPrevId: t.string,
    }),
  ],
  'ListInvoicesResponse'
);
export type ListInvoicesResponse = t.TypeOf<typeof ListInvoicesResponse>;

export const InvoiceQuery = t.partial(
  {
    status: InvoiceStatus,
    limit: BigIntFromString,
    /** paymentHash provided by nextBatchPrevId in the previous list */
    prevId: t.string,
    startDate: DateFromISOString,
    endDate: DateFromISOString,
  },
  'InvoiceQuery'
);

export type InvoiceQuery = t.TypeOf<typeof InvoiceQuery>;
