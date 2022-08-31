import * as bolt11 from 'bolt11';
import * as crypto from 'crypto';
import * as request from 'superagent';
import { DecodedLnurlPayRequest, LnurlPayParams, LnurlPayResponse } from './iLightning';
import { decodeLnurl } from './lnurlCodec';
import { decodeOrElse } from '../utils/decode';

export type ParsedLightningInvoice = {
  milliSatoshis: string;
  /** hex-encoded */
  paymentHash: string;
  /** hex-encoded */
  pubkey: string;
  /** hex-encoded */
  descriptionHash?: string;
};

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

export async function fetchLnurlPayInvoice(params: LnurlPayParams): Promise<string> {
  const { callback, milliSatAmount, metadata } = params;
  const { pr: invoice } = callback.includes('?')
    ? (await request.get(callback + `&amount=${milliSatAmount}`)).body
    : (await request.get(callback).query({ amount: milliSatAmount })).body;
  const parsedInvoice = parseLightningInvoice(invoice);
  validateLnurlInvoice(parsedInvoice, milliSatAmount, metadata);

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
export function validateLnurlInvoice(invoice: ParsedLightningInvoice, milliSatAmount: string, metadata: string): void {
  const { milliSatoshis, descriptionHash } = invoice;
  if (milliSatoshis !== milliSatAmount) {
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

  let decodedInvoice;
  try {
    decodedInvoice = bolt11.decode(invoiceStr, getNetworkForInvoice(invoiceStr));
  } catch (e) {
    throw new Error(`invoice is invalid`);
  }

  if (decodedInvoice.network === undefined) {
    throw new Error('invoice network is invalid');
  }

  // The hex encoded payment hash for the invoice we are paying
  const paymentHash = decodedInvoice.tags.find((tag) => tag.tagName === 'payment_hash')?.data;
  if (paymentHash === undefined || typeof paymentHash !== 'string') {
    throw new Error('invoice payment hash is invalid');
  }

  // The hex encoded pub key of the lightning node that created the invoice
  const pubkey = decodedInvoice.payeeNodeKey;
  if (pubkey === undefined) {
    throw new Error('invoice payee pub key is invalid');
  }

  const { millisatoshis, tags } = decodedInvoice;
  if (millisatoshis === null || millisatoshis === undefined) {
    throw new Error('invoice does not have an amount');
  }

  const descriptionHash = tags.find((tag) => tag.tagName === 'purpose_commit_hash').data;

  return { milliSatoshis: millisatoshis, paymentHash, pubkey, descriptionHash };
}
