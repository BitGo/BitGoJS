import { createHmac } from 'crypto';

/**
 * Derives an enterprise-scoped salt to prevent cross-enterprise key reuse.
 *
 * Computes HMAC-SHA256(baseSalt, enterpriseId) as a hex string.
 * The baseSalt must always come from the server — never generate it client-side.
 *
 * @param baseSalt - Server-provided base salt
 * @param enterpriseId - Enterprise identifier
 * @returns Hex-encoded HMAC-SHA256 digest
 */
export function deriveEnterpriseSalt(baseSalt: string, enterpriseId: string): string {
  return createHmac('sha256', baseSalt).update(enterpriseId).digest('hex');
}
