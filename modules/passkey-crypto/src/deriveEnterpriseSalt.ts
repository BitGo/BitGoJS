import { createHmac } from 'crypto';

/**
 * Derives an enterprise-scoped PRF salt to prevent cross-enterprise key reuse.
 *
 * Computes HMAC-SHA256(key=prfSalt_base64url_decoded, data=enterpriseId_utf8).
 * The baseSalt must always come from the server — never generate it client-side.
 *
 * Returns base64url so the same encoding is used everywhere the salt is handled
 * (server storage, PRF eval input, prfHelpers lookup). Mixing encodings
 * (e.g. hex on the client, base64url on the server) caused the PRF to receive
 * different bytes during attach vs derive in browser environments where
 * `Buffer.toString('hex')` is unreliable.
 *
 * @param baseSalt - Server-provided base64url-encoded PRF salt
 * @param enterpriseId - Enterprise identifier
 * @returns Base64url-encoded HMAC-SHA256 digest (no padding)
 */
export function deriveEnterpriseSalt(baseSalt: string, enterpriseId: string): string {
  const keyBytes = Buffer.from(baseSalt.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return createHmac('sha256', keyBytes)
    .update(enterpriseId)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
