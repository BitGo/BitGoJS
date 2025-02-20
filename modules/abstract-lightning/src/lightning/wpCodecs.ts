import * as t from 'io-ts';

import { BigIntFromString, DateFromISOString } from 'io-ts-types';
import { InvoiceStatus } from './codecs';

export const LightningInvoice = t.intersection([
  t.partial({
    /**
     * A memo or description for the invoice
     * @example Payment for the coffee
     */
    memo: t.string,
  }),
  t.type({
    /**
     * The BOLT \#11 encoded invoice
     * @example lnbc500n1p3zv5vkpp5x0thcaz8wep54clc2xt5895azjdzmthyskzzh9yslggy74qtvl6sdpdg3hkuct5d9hkugrxdaezqjn0dphk2fmnypkk2mtsdahkccqzpgxqyz5vqsp5v80q4vq4pwakq2l0hcqgtelgajsymv4ud4jdcrqtnzhvet55qlus9qyyssquqh2wl2m866qs5n72c5vg6wmqx9vzwhs5ypualq4mcu76h2tdkcq3jtjwtggfff7xwtdqxlnwqk8cxpzryjghrmmq3syraswp9vjr7cqry9l96
     */
    invoice: t.string,
    /**
     * The payment hash of the invoice
     * @example 63d9ce82e09d16761a85116ed8b65407db4fb22f85d03573de09c480f2c6d175
     */
    paymentHash: t.string,
    /**
     * The value of the invoice in satoshis
     * @example 50000
     */
    valueMsat: BigIntFromString,
    /**
     * ISO-8601 string representing when the invoice will expire
     * @example 2022-04-01T18:46:24.677Z
     */
    expiresAt: DateFromISOString,
    /** The status of the invoice */
    status: t.union([t.literal('open'), t.literal('settled'), t.literal('canceled')]),
    /** The wallet to which this invoice belongs */
    walletId: t.string,
  }),
]);

export type LightningInvoice = t.TypeOf<typeof LightningInvoice>;

export const CreateInvoiceRequest = t.type({
  valueMsat: BigIntFromString,
  memo: t.string,
  expiry: t.number,
});

export type CreateInvoiceRequest = t.TypeOf<typeof CreateInvoiceRequest>;

export const GetInvoicesQuery = t.partial({
  status: InvoiceStatus,
  limit: BigIntFromString,
  startDate: DateFromISOString,
  endDate: DateFromISOString,
});

export type GetInvoicesQuery = t.TypeOf<typeof GetInvoicesQuery>;
