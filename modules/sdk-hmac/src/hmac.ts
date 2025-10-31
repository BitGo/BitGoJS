import { type BinaryLike, createHmac, type KeyObject } from 'crypto';
import * as urlLib from 'url';
import * as sjcl from '@bitgo/sjcl';
import {
  CalculateHmacSubjectOptions,
  CalculateRequestHeadersOptions,
  CalculateRequestHmacOptions,
  RequestHeaders,
  VerifyResponseInfo,
  VerifyResponseOptions,
} from './types';

/**
 * Calculate the HMAC for the given key and message
 * @param key {String} - the key to use for the HMAC
 * @param message {String} - the actual message to HMAC
 * @returns {*} - the result of the HMAC operation
 */
export function calculateHMAC(key: string | BinaryLike | KeyObject, message: string | BinaryLike): string {
  return createHmac('sha256', key).update(message).digest('hex');
}

/**
 * Calculate the subject string that is to be HMAC'ed for a HTTP request or response
 * @param urlPath request url, including query params
 * @param text request body text
 * @param timestamp request timestamp from `Date.now()`
 * @param statusCode Only set for HTTP responses, leave blank for requests
 * @param method request method
 * @param authVersion authentication version (2 or 3)
 * @param useOriginalPath whether to use the original urlPath without parsing (default false)
 * @returns {string | Buffer}
 */
export function calculateHMACSubject<T extends string | Buffer = string>(
  { urlPath, text, timestamp, statusCode, method, authVersion }: CalculateHmacSubjectOptions<T>,
  useOriginalPath = false
): T {
  /* Normalize legacy 'del' to 'delete' for backward compatibility */
  if (method === 'del') {
    method = 'delete';
  }

  let queryPath: string | null = urlPath;
  if (!useOriginalPath) {
    const urlDetails = urlLib.parse(urlPath);
    queryPath = urlDetails.query && urlDetails.query.length > 0 ? urlDetails.path : urlDetails.pathname;
  }

  let prefixedText: string;
  if (statusCode !== undefined && isFinite(statusCode) && Number.isInteger(statusCode)) {
    prefixedText =
      authVersion === 3
        ? [method.toUpperCase(), timestamp, queryPath, statusCode].join('|')
        : [timestamp, queryPath, statusCode].join('|');
  } else {
    prefixedText =
      authVersion === 3
        ? [method.toUpperCase(), timestamp, '3.0', queryPath].join('|')
        : [timestamp, queryPath].join('|');
  }

  const isBuffer = Buffer.isBuffer(text);
  if (isBuffer) {
    return Buffer.concat([Buffer.from(prefixedText + '|', 'utf-8'), text]) as T;
  }
  return [prefixedText, text].join('|') as T;
}

/**
 * Calculate the HMAC for an HTTP request
 */
export function calculateRequestHMAC<T extends string | Buffer = string>({
  url: urlPath,
  text,
  timestamp,
  token,
  method,
  authVersion,
}: CalculateRequestHmacOptions<T>): string {
  const signatureSubject = calculateHMACSubject({ urlPath, text, timestamp, method, authVersion });

  // calculate the HMAC
  return calculateHMAC(token, signatureSubject);
}

/**
 * Calculate request headers with HMAC
 */
export function calculateRequestHeaders<T extends string | Buffer = string>({
  url,
  text,
  token,
  method,
  authVersion,
}: CalculateRequestHeadersOptions<T>): RequestHeaders {
  const timestamp = Date.now();
  const hmac = calculateRequestHMAC({ url, text, timestamp, token, method, authVersion });

  // calculate the SHA256 hash of the token
  const hashDigest = sjcl.hash.sha256.hash(token);
  const tokenHash = sjcl.codec.hex.fromBits(hashDigest);
  return {
    hmac,
    timestamp,
    tokenHash,
  };
}

/**
 * Verify the HMAC for an HTTP response
 */
export function verifyResponse<T extends string | Buffer = string>({
  url: urlPath,
  statusCode,
  text,
  timestamp,
  token,
  hmac,
  method,
  authVersion,
}: VerifyResponseOptions<T>): VerifyResponseInfo<T> {
  const signatureSubject = calculateHMACSubject({
    urlPath,
    text,
    timestamp,
    statusCode,
    method,
    authVersion,
  });

  // calculate the HMAC
  const expectedHmac = calculateHMAC(token, signatureSubject);

  // determine if the response is still within the validity window (5 minute window)
  const now = Date.now();
  const isInResponseValidityWindow = timestamp >= now - 1000 * 60 * 5 && timestamp <= now;

  // verify the HMAC and timestamp
  return {
    isValid: expectedHmac === hmac,
    expectedHmac,
    signatureSubject,
    isInResponseValidityWindow,
    verificationTime: now,
  };
}
