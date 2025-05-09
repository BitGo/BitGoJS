import * as bolt11 from 'bolt11';
import * as crypto from 'crypto';
import * as superagent from 'superagent';
import { bech32 } from 'bech32';
import { decodeOrElse } from '@bitgo/sdk-core';

import {
  LnurlPayResponseCodec,
  LnurlPayInvoiceResponseCodec,
  LnurlPayInvoiceResponse,
  DecodedLnurlPayRequest,
  LnurlPayParams,
  ParsedLightningInvoice,
} from '../codecs/api/lnurl';

/**
 * Decodes an LNURL-pay request and makes an HTTP request to the decoded URL
 * to retrieve details for the requested payment.
 * @param lnurl A bech32 encoded LNURL-pay request string
 * @returns An LNURL-pay request message with payment details and domain
 */
export async function decodeLnurlPay(lnurl: string): Promise<DecodedLnurlPayRequest> {
  // Manually validate the LNURL instead of using a codec
  if (!isValidLnurl(lnurl)) {
    throw new Error('Invalid LNURL format');
  }

  const decodedUrl = decodeLnurl(lnurl);
  const { body } = await superagent.get(decodedUrl);
  const domain = new URL(decodedUrl).hostname;

  // Check if it's an error response
  if (body && typeof body === 'object' && body.status === 'ERROR') {
    throw new Error(body.reason || 'Unknown LNURL error');
  }

  // Parse as payment response
  const payResponse = decodeOrElse('LnurlPayResponse', LnurlPayResponseCodec, body, (errors) => {
    throw new Error(`Invalid LNURL-pay response: ${errors}`);
  });

  return {
    ...payResponse,
    domain,
  };
}

/**
 * Parse a lightning invoice to extract key information
 * @param invoiceStr - Invoice string to parse
 * @returns Parsed invoice data
 */
export function parseLightningInvoice(invoiceStr: unknown): ParsedLightningInvoice {
  if (typeof invoiceStr !== 'string') {
    throw new Error('invoice is malformed');
  }

  // For signet invoices that start with lntbs
  const network = getNetworkForInvoice(invoiceStr);
  const decodedInvoice = bolt11.decode(invoiceStr, network);

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
  // Don't validate millisatoshis - it can be undefined for zero-amount invoices
  // Just set it to null in that case, as per our type definition
  /* if (millisatoshis === undefined) {
    throw new Error('invoice millisatoshis amount is invalid');
  } */

  const descriptionHash = tags.find((tag) => tag.tagName === 'purpose_commit_hash')?.data;
  if (descriptionHash !== undefined && typeof descriptionHash !== 'string') {
    throw new Error('invoice description hash is invalid');
  }

  return { millisatoshis: millisatoshis ? BigInt(millisatoshis) : null, paymentHash, payeeNodeKey, descriptionHash };
}

/**
 * Get the appropriate network for a lightning invoice
 * @param invoice - Lightning invoice string
 * @returns Network configuration or undefined for default
 */
function getNetworkForInvoice(invoice: string) {
  if (invoice.startsWith('lntbs')) {
    // signet invoices are not supported by our bolt11 dependency
    // because the `tbs` prefix used for the invoice does not match the `tb`
    // prefix used by on-chain signet addresses
    // see: https://github.com/bitcoinjs/bolt11/pull/58#issuecomment-1106495709
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
 * Validates that a lightning invoice matches the expected amount and metadata
 * @param invoice - The invoice to validate
 * @param millisatAmount - Expected amount in millisatoshis
 * @param metadata - Metadata string from the LNURL-pay response
 */
export function validateLnurlInvoice(invoice: ParsedLightningInvoice, millisatAmount: bigint, metadata: string): void {
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
 * Fetches a lightning invoice from an LNURL-pay callback server
 * @param params - Parameters for the LNURL payment
 * @returns Invoice response with payment request
 */
export async function fetchLnurlPayInvoice(params: LnurlPayParams): Promise<LnurlPayInvoiceResponse> {
  const { callback, millisatAmount, metadata, comment } = params;
  // Use toString() when adding to URL
  const msatString = millisatAmount.toString();

  let response: superagent.Response;
  if (comment) {
    response = callback.includes('?')
      ? await superagent.get(callback + `&amount=${msatString}&comment=${comment}`)
      : await superagent.get(callback).query({ amount: msatString, comment });
  } else {
    response = callback.includes('?')
      ? await superagent.get(callback + `&amount=${msatString}`)
      : await superagent.get(callback).query({ amount: msatString });
  }

  // Parse the invoice response
  const invoiceResponse = decodeOrElse(
    'LnurlPayInvoiceResponse',
    LnurlPayInvoiceResponseCodec,
    response.body,
    (errors: unknown) => {
      throw new Error(`Invalid invoice response: ${errors}`);
    }
  );

  // Validate the invoice
  const parsedInvoice = parseLightningInvoice(invoiceResponse.pr);
  validateLnurlInvoice(parsedInvoice, millisatAmount, metadata);

  return invoiceResponse;
}

/**
 * Process an LNURL payment request from start to finish
 * @param lnurl - LNURL to process
 * @param amountSats - Amount to pay in satoshis
 * @param comment - Optional comment to include in the request
 * @returns Invoice to be sent to the backend
 */
export async function processLnurlPayment(
  lnurl: string,
  amountSats: bigint,
  comment?: string
): Promise<{
  invoice: string;
}> {
  if (amountSats <= BigInt(0)) {
    throw new Error('Amount must be a positive integer');
  }

  // Convert satoshis to millisatoshis (1 sat = 1000 millisats)
  const millisatAmount = amountSats * BigInt(1000);

  // Decode LNURL and fetch payment metadata
  const payResponse = await decodeLnurlPay(lnurl);

  // Validate amount range
  if (millisatAmount < payResponse.minSendable || millisatAmount > payResponse.maxSendable) {
    throw new Error(
      `Amount out of range: ${millisatAmount} msats (min: ${payResponse.minSendable}, max: ${payResponse.maxSendable})`
    );
  }

  // Fetch payment invoice
  const invoiceResponse = await fetchLnurlPayInvoice({
    callback: payResponse.callback,
    millisatAmount,
    metadata: payResponse.metadata,
  });

  return {
    invoice: invoiceResponse.pr,
  };
}

/**
 * Encodes a URL into an LNURL bech32 encoded string
 * @param url - URL to encode
 * @returns LNURL bech32 encoded string
 */
export function encodeLnurl(url: string): string {
  return bech32.encode('lnurl', bech32.toWords(Buffer.from(url)));
}

/**
 * Decodes an LNURL to its original URL
 * @param lnurl - LNURL string to decode
 * @returns Decoded URL or throws an error
 */
export function decodeLnurl(lnurl: string): string {
  const splittedLnurl = lnurl.split(':');

  let parsedLnurl: string;
  if (splittedLnurl.length === 2) {
    if (splittedLnurl[0] !== 'lightning') {
      throw new Error('invalid lnurl');
    }
    parsedLnurl = splittedLnurl[1];
  } else {
    parsedLnurl = splittedLnurl[0];
  }

  try {
    const { prefix, words } = bech32.decode(parsedLnurl, 2000);

    if (prefix !== 'lnurl') {
      throw new Error('invalid lnurl');
    }

    return Buffer.from(bech32.fromWords(words)).toString();
  } catch (error) {
    throw new Error('invalid lnurl');
  }
}

/**
 * Checks if a string is a valid LNURL
 * @param str - String to check
 * @returns True if valid LNURL
 */
export function isValidLnurl(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  // LNURL should start with 'lnurl' or 'lightning:lnurl'
  if (!str.toLowerCase().startsWith('lnurl') && !str.toLowerCase().startsWith('lightning:lnurl')) {
    return false;
  }

  try {
    decodeLnurl(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse metadata JSON string from LNURL-pay response
 * @param metadataStr - Metadata string to parse
 * @returns Parsed metadata with description
 */
export function parsePayMetadata(metadataStr: string): { description?: string } {
  const parsed = JSON.parse(metadataStr);
  if (!Array.isArray(parsed)) {
    throw new Error('Metadata is not an array');
  }

  const textMetadata = parsed.find((item) => Array.isArray(item) && item[0] === 'text/plain');
  return { description: textMetadata ? textMetadata[1] : undefined };
}
