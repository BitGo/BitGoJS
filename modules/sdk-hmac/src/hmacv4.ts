/**
 * @prettier
 *
 * V4 HMAC Authentication Module
 *
 * This module implements the v4 authentication scheme which uses a canonical
 * preimage construction with newline-separated fields and body hashing.
 *
 * Key differences from v2/v3:
 * - Separator: newline (\n) instead of pipe (|)
 * - Body: SHA256 hash of raw bytes instead of actual body content
 * - Timestamp: seconds instead of milliseconds
 * - New field: authRequestId for request tracking
 * - Trailing newline in preimage
 * - Support for x-original-* headers (proxy scenarios)
 */

import { timingSafeEqual } from 'crypto';
import {
  createHmacWithSha256,
  sha256Hex,
  normalizeMethod,
  getTimestampSec,
  extractPathWithQuery,
  type HashableData,
} from './util';
import {
  CalculateV4PreimageOptions,
  CalculateV4RequestHmacOptions,
  CalculateV4RequestHeadersOptions,
  V4RequestHeaders,
  VerifyV4ResponseOptions,
  VerifyV4ResponseInfo,
} from './types';

/**
 * Build canonical preimage for v4 authentication.
 *
 * The preimage is constructed as newline-separated values with a trailing newline:
 * ```
 * {timestampSec}
 * {METHOD}
 * {pathWithQuery}
 * {bodyHashHex}
 * {authRequestId}
 * ```
 *
 * This function normalizes the HTTP method to uppercase and handles the
 * legacy 'del' method conversion to 'DELETE'.
 *
 * @param options - The preimage components
 * @returns Newline-separated canonical preimage string with trailing newline
 *
 * @example
 * ```typescript
 * const preimage = calculateV4Preimage({
 *   timestampSec: 1761100000,
 *   method: 'post',
 *   pathWithQuery: '/v2/wallets/transfer?foo=bar',
 *   bodyHashHex: '0d5e3b7a8f9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
 *   authRequestId: '1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e',
 * });
 *
 * // Result:
 * // "1761100000\nPOST\n/v2/wallets/transfer?foo=bar\n0d5e3b...d6e\n1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e\n"
 * ```
 */
export function calculateV4Preimage({
  timestampSec,
  method,
  pathWithQuery,
  bodyHashHex,
  authRequestId,
}: CalculateV4PreimageOptions): string {
  const normalizedMethod = normalizeMethod(method);

  // Build newline-separated preimage with trailing newline
  const components = [timestampSec.toString(), normalizedMethod, pathWithQuery, bodyHashHex, authRequestId];

  return components.join('\n') + '\n';
}

/**
 * Calculate SHA256 hash of body and return as lowercase hex string.
 *
 * This is used to compute the bodyHashHex field for v4 authentication.
 * The hash is computed over the raw bytes of the request body, ensuring
 * that the exact bytes sent over the wire are used for signature calculation.
 *
 * Accepts common byte representations for Node.js and browser environments,
 * including Uint8Array and ArrayBuffer for Fetch API compatibility.
 *
 * @param body - Raw request body (string, Buffer, Uint8Array, or ArrayBuffer)
 * @returns Lowercase hex SHA256 hash (64 characters)
 *
 * @example
 * ```typescript
 * // Node.js with Buffer
 * const hash1 = calculateBodyHash(Buffer.from('{"address":"tb1q...","amount":100000}'));
 *
 * // Browser with Uint8Array
 * const hash2 = calculateBodyHash(new TextEncoder().encode('{"address":"tb1q..."}'));
 *
 * // Browser with ArrayBuffer
 * const hash3 = calculateBodyHash(await response.arrayBuffer());
 *
 * // All return: '0d5e3b7a8f...' (64 character hex string)
 * ```
 */
export function calculateBodyHash(body: HashableData): string {
  return sha256Hex(body);
}

/**
 * Calculate the HMAC-SHA256 signature for a v4 HTTP request.
 *
 * This function:
 * 1. Builds the canonical preimage from the provided options
 * 2. Computes HMAC-SHA256 of the preimage using the raw access token
 *
 * @param options - Request parameters and raw access token
 * @returns Lowercase hex HMAC-SHA256 signature
 *
 * @example
 * ```typescript
 * const hmac = calculateV4RequestHmac({
 *   timestampSec: 1761100000,
 *   method: 'POST',
 *   pathWithQuery: '/v2/wallets/transfer',
 *   bodyHashHex: '0d5e3b...',
 *   authRequestId: '1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e',
 *   rawToken: 'your-token',
 * });
 * ```
 */
export function calculateV4RequestHmac({
  timestampSec,
  method,
  pathWithQuery,
  bodyHashHex,
  authRequestId,
  rawToken,
}: CalculateV4RequestHmacOptions): string {
  const preimage = calculateV4Preimage({
    timestampSec,
    method,
    pathWithQuery,
    bodyHashHex,
    authRequestId,
  });

  return createHmacWithSha256(rawToken, preimage);
}

/**
 * Generate all headers required for v4 authenticated requests.
 *
 * This is a convenience function that:
 * 1. Generates the current timestamp (in seconds)
 * 2. Calculates the body hash from raw bytes
 * 3. Computes the HMAC signature
 * 4. Returns all values needed for request headers
 *
 * @param options - Request parameters including raw body and raw token
 * @returns Object containing all v4 authentication header values
 *
 * @example
 * ```typescript
 * const headers = calculateV4RequestHeaders({
 *   method: 'POST',
 *   pathWithQuery: '/v2/wallets/transfer?foo=bar',
 *   rawBody: Buffer.from('{"address":"tb1q..."}'),
 *   rawToken: 'your-token',
 *   authRequestId: '1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e',
 * });
 *
 * // Use headers to set:
 * // - X-Request-Timestamp: headers.timestampSec
 * // - X-Signature: headers.hmac
 * // - X-Content-SHA256: headers.bodyHashHex
 * // - X-Auth-Request-Id: headers.authRequestId
 * ```
 */
export function calculateV4RequestHeaders({
  method,
  pathWithQuery,
  rawBody,
  rawToken,
  authRequestId,
}: CalculateV4RequestHeadersOptions): V4RequestHeaders {
  const timestampSec = getTimestampSec();
  const bodyHashHex = calculateBodyHash(rawBody);

  const hmac = calculateV4RequestHmac({
    timestampSec,
    method,
    pathWithQuery,
    bodyHashHex,
    authRequestId,
    rawToken,
  });

  return {
    hmac,
    timestampSec,
    bodyHashHex,
    authRequestId,
  };
}

/**
 * Build canonical preimage for v4 response verification.
 *
 * Response preimage includes the status code and uses the same format:
 * ```
 * {timestampSec}
 * {METHOD}
 * {pathWithQuery}
 * {statusCode}
 * {bodyHashHex}
 * {authRequestId}
 * ```
 *
 * @param options - Response verification parameters
 * @returns Newline-separated canonical preimage string with trailing newline
 */
export function calculateV4ResponsePreimage({
  timestampSec,
  method,
  pathWithQuery,
  statusCode,
  bodyHashHex,
  authRequestId,
}: Omit<VerifyV4ResponseOptions, 'hmac' | 'rawToken'>): string {
  const normalizedMethod = normalizeMethod(method);

  const components = [
    timestampSec.toString(),
    normalizedMethod,
    pathWithQuery,
    statusCode.toString(),
    bodyHashHex,
    authRequestId,
  ];

  return components.join('\n') + '\n';
}

/**
 * Verify the HMAC signature of a v4 HTTP response.
 *
 * This function:
 * 1. Reconstructs the canonical preimage from response data
 * 2. Calculates the expected HMAC
 * 3. Compares with the received HMAC
 * 4. Checks if the timestamp is within the validity window
 *
 * The validity window is:
 * - 5 minutes backwards (to account for clock skew and network latency)
 * - 1 minute forwards (to account for minor clock differences)
 *
 * @param options - Response data and raw token for verification
 * @returns Verification result including validity and diagnostic info
 */
export function verifyV4Response({
  hmac,
  timestampSec,
  method,
  pathWithQuery,
  bodyHashHex,
  authRequestId,
  statusCode,
  rawToken,
}: VerifyV4ResponseOptions): VerifyV4ResponseInfo {
  // Build the response preimage
  const preimage = calculateV4ResponsePreimage({
    timestampSec,
    method,
    pathWithQuery,
    statusCode,
    bodyHashHex,
    authRequestId,
  });

  // Calculate expected HMAC
  const expectedHmac = createHmacWithSha256(rawToken, preimage);

  // Use constant-time comparison to prevent timing side-channel attacks
  const hmacBuffer = Buffer.from(hmac, 'hex');
  const expectedHmacBuffer = Buffer.from(expectedHmac, 'hex');
  const isHmacValid =
    hmacBuffer.length === expectedHmacBuffer.length && timingSafeEqual(hmacBuffer, expectedHmacBuffer);

  // Check timestamp validity window
  const nowSec = getTimestampSec();
  const backwardValidityWindowSec = 5 * 60; // 5 minutes
  const forwardValidityWindowSec = 1 * 60; // 1 minute
  const isInResponseValidityWindow =
    timestampSec >= nowSec - backwardValidityWindowSec && timestampSec <= nowSec + forwardValidityWindowSec;

  return {
    isValid: isHmacValid,
    expectedHmac,
    preimage,
    isInResponseValidityWindow,
    verificationTime: Date.now(),
  };
}

/**
 * Extract path with query from x-original-uri header or request URL.
 * Always canonicalizes to pathname + search to handle absolute URLs.
 *
 * @param xOriginalUri - Value of x-original-uri header (if present)
 * @param requestUrl - The actual request URL
 * @returns The canonical path with query to use for preimage calculation
 *
 */
export function getPathWithQuery(xOriginalUri: string | undefined, requestUrl: string): string {
  // Prefer x-original-uri if available (proxy scenario)
  const rawPath = xOriginalUri ?? requestUrl;
  return extractPathWithQuery(rawPath);
}

/**
 * Get method from x-original-method header or actual request method.
 *
 * @param xOriginalMethod - Value of x-original-method header (if present)
 * @param requestMethod - The actual request method
 * @returns The method to use for preimage calculation
 */
export function getMethod(xOriginalMethod: string | undefined, requestMethod: string): string {
  // Prefer x-original-method if available (proxy scenario)
  return xOriginalMethod ?? requestMethod;
}
