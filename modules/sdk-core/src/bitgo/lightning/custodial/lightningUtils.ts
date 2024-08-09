import * as bolt11 from 'bolt11';
import * as crypto from 'crypto';
import * as request from 'superagent';
import { DecodedLnurlPayRequest, LnurlPayParams, LnurlPayResponse } from './iLightning';
import { decodeLnurl } from './lnurlCodec';
import { decodeOrElse } from '../../utils/decode';

export type ParsedLightningInvoice = {
  /**
   * The amount of millisatoshi requested by this invoice. If null then
   * the invoice does not specify an amount and will accept any payment.
   */
  millisatoshis: string | null;
  /** The hex encoded payment hash for the invoice */
  paymentHash: string;
  /** The hex encoded node pub key of the payee that created the invoice */
  payeeNodeKey: string;
  /** The hex encoded SHA256 hash of the description of what the invoice is for */
  descriptionHash?: string;
};

/**
 * Decodes an LNURL-pay request and makes an HTTP request to the decoded url
 * to retrieve details for the requested payment.
 * @param lnurl A bech32 encoded LNURL-pay request string
 * @returns {DecodedLnurlPayRequest} An LNURL-pay request message specifying
 * a min and max amount for the payment, metadata describing what the payment
 * is for, and a callback that can be used to fetch a lightning invoice for
 * the payment.
 */
export async function decodeLnurlPay(lnurl: string): Promise<DecodedLnurlPayRequest> {
  const url = decodeLnurl(lnurl);
  const { body } = await request.get(url);
  const decodedRes = decodeOrElse(LnurlPayResponse.name, LnurlPayResponse, body, (errors) => {
    throw new Error(`error(s) parsing lnurl response: ${errors}`);
  });
  const domain = new URL(url).hostname;

  return {
    ...decodedRes,
    domain,
  };
}

/**
 * Fetches a lightning invoice from an LNURL-pay callback server for a specified
 * amount of millisatoshis.
 * @param params {LnurlPayParams} An object specifying an amount and a callback
 * url with which to request a lightning invoice for an LNURL-pay request.
 * @returns {string} A BOLT #11 encoded lightning invoice
 */
export async function fetchLnurlPayInvoice(params: LnurlPayParams): Promise<string> {
  const { callback, millisatAmount, metadata } = params;
  const { pr: invoice } = callback.includes('?')
    ? (await request.get(callback + `&amount=${millisatAmount}`)).body
    : (await request.get(callback).query({ amount: millisatAmount })).body;
  const parsedInvoice = parseLightningInvoice(invoice);
  validateLnurlInvoice(parsedInvoice, millisatAmount, metadata);

  return invoice;
}

function getNetworkForInvoice(invoice: string) {
  if (invoice.startsWith('lntbs')) {
    // signet invoices are not supported by our bolt11 dependency
    // because the `tbs` prefix used for the invoice does not match the `tb`
    // prefix used by on-chain signet addresses
    // see: https://github.com/bitcoinjs/bolt11/pull/58#issuecomment-1106495709
    // we can still decode the invoice however using a custom network
    return {
      bech32: 'tbs',
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      validWitnessVersions: [0, 1],
    };
  }

  return undefined;
}

/**
 * @param {ParsedLightningInvoice} invoice - a parsed lightning invoice
 * @param {number} amount - amount intended to pay for the invoice
 * @param {string} metadata - metadata that is used to verify the fetched invoice
 * @throws error for invoice that does not match with amount and metadata
 */
export function validateLnurlInvoice(invoice: ParsedLightningInvoice, millisatAmount: string, metadata: string): void {
  const { millisatoshis, descriptionHash } = invoice;
  if (millisatoshis !== millisatAmount) {
    throw new Error('amount of invoice does not match with given amount');
  }

  const hash = crypto.createHash('sha256').update(metadata).digest('hex');
  if (descriptionHash !== hash) {
    throw new Error('invoice h tag does not match with hash of metadata');
  }
}

/**
 * @param {unknown} invoiceStr - a lightning invoice
 * @return {ParsedLightningInvoice}
 * @throws error for invalid lightning invoice
 */
export function parseLightningInvoice(invoiceStr: unknown): ParsedLightningInvoice {
  if (typeof invoiceStr !== 'string') {
    throw new Error('invoice is malformed');
  }

  const decodedInvoice = bolt11.decode(invoiceStr, getNetworkForInvoice(invoiceStr));

  if (decodedInvoice.network === undefined) {
    throw new Error('invoice network is invalid');
  }

  const { millisatoshis, tags, payeeNodeKey } = decodedInvoice;

  const paymentHash = tags.find((tag) => tag.tagName === 'payment_hash')?.data;
  if (paymentHash === undefined || typeof paymentHash !== 'string') {
    throw new Error('invoice payment hash is invalid');
  }
  if (payeeNodeKey === undefined) {
    throw new Error('invoice payee pub key is invalid');
  }
  if (millisatoshis === undefined) {
    throw new Error('invoice millisatoshis amount is invalid');
  }

  const descriptionHash = tags.find((tag) => tag.tagName === 'purpose_commit_hash')?.data;
  if (descriptionHash !== undefined && typeof descriptionHash !== 'string') {
    throw new Error('invoice description hash is invalid');
  }

  return { millisatoshis, paymentHash, payeeNodeKey, descriptionHash };
}
