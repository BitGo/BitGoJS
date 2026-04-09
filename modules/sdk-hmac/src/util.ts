import { createHash, createHmac, type BinaryLike, type KeyObject } from 'crypto';

export type HashableData = string | Buffer | Uint8Array | ArrayBuffer;

/**
 * Calculate SHA256 hash of data and return as lowercase hex string.
 * Used for body hash calculation in v4 authentication.
 *
 * Accepts string, Buffer, Uint8Array, and ArrayBuffer for compatibility
 * with both Node.js and browser environments.
 *
 * Note: ArrayBuffer is converted to Uint8Array internally since Node.js crypto
 * requires TypedArray or DataView, not plain ArrayBuffer.
 *
 * @param data - The data to hash
 * @returns Lowercase hex string of SHA256 hash
 */
export function sha256Hex(data: HashableData): string {
  const normalizedData = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  return createHash('sha256')
    .update(normalizedData as BinaryLike)
    .digest('hex');
}

/**
 * Calculate HMAC-SHA256 and return as lowercase hex string.
 * This is the core cryptographic primitive shared by v2/v3/v4 authentication.
 *
 * @param key - The secret key for HMAC
 * @param message - The message to authenticate
 * @returns Lowercase hex string of HMAC-SHA256
 */
export function createHmacWithSha256(key: string | BinaryLike | KeyObject, message: string | BinaryLike): string {
  return createHmac('sha256', key).update(message).digest('hex');
}

/**
 * Normalize HTTP method to uppercase.
 * Handles legacy 'del' → 'DELETE' conversion for backward compatibility.
 *
 * @param method - HTTP method (case-insensitive)
 * @returns Uppercase HTTP method
 */
export function normalizeMethod(method: string): string {
  const lowerMethod = method.toLowerCase();
  if (lowerMethod === 'del') {
    return 'DELETE';
  }
  return method.toUpperCase();
}

/**
 * Extract path with query string from a URL.
 * Handles both absolute URLs and relative paths.
 *
 * @param urlPath - Full URL or relative path
 * @returns Path with query string (e.g., '/api/v2/wallet?foo=bar')
 */
export function extractPathWithQuery(urlPath: string): string {
  try {
    // Try parsing as absolute URL first
    const url = new URL(urlPath);
    return url.pathname + url.search;
  } catch {
    try {
      const url = new URL(urlPath, 'http://localhost');
      return url.pathname + url.search;
    } catch {
      return urlPath;
    }
  }
}

/**
 * Get current timestamp in seconds (Unix epoch).
 * Used for v4 authentication which uses seconds instead of milliseconds.
 *
 * @returns Current Unix timestamp in seconds
 */
export function getTimestampSec(): number {
  return Math.floor(Date.now() / 1000);
}
