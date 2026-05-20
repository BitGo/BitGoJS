/**
 * Base64url encoding helpers.
 *
 * Base64url uses the same alphabet as standard base64 except `+` becomes `-`,
 * `/` becomes `_`, and padding (`=`) is stripped. Browser WebAuthn APIs and
 * the BitGo server both use base64url for credential IDs and PRF salts, so we
 * normalise to it everywhere on the client to avoid mismatches caused by
 * mixing encodings.
 */

/** Converts a standard base64 string (or already-base64url string) to base64url. */
export function toBase64Url(s: string): string {
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Encodes an ArrayBuffer or Buffer as a base64url string (no padding). */
export function bufferToBase64Url(buffer: ArrayBuffer | Buffer): string {
  return toBase64Url(Buffer.from(buffer as ArrayBuffer).toString('base64'));
}

/** Decodes a base64url string into a Buffer. */
export function base64UrlToBuffer(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
