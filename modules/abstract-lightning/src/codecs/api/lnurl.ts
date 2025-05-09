import * as t from 'io-ts';
import { BigIntFromString } from 'io-ts-types/lib/BigIntFromString';

// LNURL-pay response from initial request
export const LnurlPayResponseCodec = t.strict({
  tag: t.literal('payRequest'),
  callback: t.string,
  /** The maximum amount in millisatoshis we can pay for this LNURL request */
  maxSendable: BigIntFromString,
  /** The minimum amount in millisatoshis we can pay for this LNURL request */
  minSendable: BigIntFromString,
  /** A json array in string format describing the payment */
  metadata: t.string,
});

// LNURL-pay invoice response
export const LnurlPayInvoiceResponseCodec = t.intersection(
  [
    t.type({
      pr: t.string,
    }),
    t.partial({
      successAction: t.unknown,
      routes: t.array(t.unknown),
    }),
  ],
  'LnurlPayInvoiceResponse'
);

/**
 * Parsed Lightning invoice with key information
 */
export const ParsedLightningInvoiceCodec = t.type({
  /** The hex encoded payment hash for the invoice */
  paymentHash: t.string,
  /** The hex encoded node pub key of the payee that created the invoice */
  payeeNodeKey: t.string,
  /** The amount of millisatoshi requested by this invoice */
  millisatoshis: t.union([BigIntFromString, t.null]),
  /** The hex encoded SHA256 hash of the description of what the invoice is for */
  descriptionHash: t.union([t.string, t.undefined]),
});

export type DecodedLnurlPayRequest = LnurlPayResponse & {
  /**
   * From https://github.com/fiatjaf/lnurl-rfc/blob/luds/06.md#pay-to-static-qrnfclink
   * a payment dialog must include: Domain name extracted from LNURL query string.
   */
  domain: string;
};

// Parameter interface
export interface LnurlPayParams {
  callback: string;
  millisatAmount: bigint;
  metadata: string;
  comment?: string;
}

export type ParsedLightningInvoice = t.TypeOf<typeof ParsedLightningInvoiceCodec>;
export type LnurlPayResponse = t.TypeOf<typeof LnurlPayResponseCodec>;
export type LnurlPayInvoiceResponse = t.TypeOf<typeof LnurlPayInvoiceResponseCodec>;
