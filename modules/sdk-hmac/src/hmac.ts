import { createHmac } from 'crypto';
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
export function calculateHMAC(key: string, message: string): string {
  return createHmac('sha256', key).update(message).digest('hex');
}

/**
 * Calculate the subject string that is to be HMAC'ed for a HTTP request or response
 * @param urlPath request url, including query params
 * @param text request body text
 * @param timestamp request timestamp from `Date.now()`
 * @param statusCode Only set for HTTP responses, leave blank for requests
 * @param method request method
 * @returns {string}
 */
export function calculateHMACSubject({
  urlPath,
  text,
  timestamp,
  statusCode,
  method,
  authVersion,
}: CalculateHmacSubjectOptions): string {
  const urlDetails = urlLib.parse(urlPath);
  const queryPath = urlDetails.query && urlDetails.query.length > 0 ? urlDetails.path : urlDetails.pathname;
  if (statusCode !== undefined && isFinite(statusCode) && Number.isInteger(statusCode)) {
    if (authVersion === 3) {
      return [method.toUpperCase(), timestamp, queryPath, statusCode, text].join('|');
    }
    return [timestamp, queryPath, statusCode, text].join('|');
  }
  if (authVersion === 3) {
    return [method.toUpperCase(), timestamp, '3.0', queryPath, text].join('|');
  }
  return [timestamp, queryPath, text].join('|');
}

/**
 * Calculate the HMAC for an HTTP request
 */
export function calculateRequestHMAC({
  url: urlPath,
  text,
  timestamp,
  token,
  method,
  authVersion,
}: CalculateRequestHmacOptions): string {
  const signatureSubject = calculateHMACSubject({ urlPath, text, timestamp, method, authVersion });

  // calculate the HMAC
  return calculateHMAC(token, signatureSubject);
}

/**
 * Calculate request headers with HMAC
 */
export function calculateRequestHeaders({
  url,
  text,
  token,
  method,
  authVersion,
}: CalculateRequestHeadersOptions): RequestHeaders {
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
export function verifyResponse({
  url: urlPath,
  statusCode,
  text,
  timestamp,
  token,
  hmac,
  method,
  authVersion,
}: VerifyResponseOptions): VerifyResponseInfo {
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
