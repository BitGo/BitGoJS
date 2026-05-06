import { createHmac } from 'crypto';

/**
 * Derives an enterprise-scoped PRF salt to prevent cross-enterprise key reuse.
 *
 * Computes HMAC-SHA256(key=prfSalt_base64url_decoded, data=enterpriseId_utf8).
 * The baseSalt must always come from the server — never generate it client-side.
 *
 * @param baseSalt - Server-provided base64url-encoded PRF salt
 * @param enterpriseId - Enterprise identifier
 * @returns Hex-encoded HMAC-SHA256 digest
 */
export function deriveEnterpriseSalt(baseSalt: string, enterpriseId: string): string {
  const keyBytes = Buffer.from(baseSalt.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return createHmac('sha256', keyBytes).update(enterpriseId).digest('hex');
}
