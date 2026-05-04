import * as sjcl from '@bitgo/sjcl';

/**
 * Derives an enterprise-scoped PRF salt to prevent cross-enterprise key reuse.
 *
 * Computes HMAC-SHA256(key=prfSalt_base64url_decoded, data=enterpriseId_utf8).
 * The baseSalt must always come from the server — never generate it client-side.
 *
 * @param baseSalt - Server-provided base64url-encoded PRF salt
 * @param enterpriseId - Enterprise identifier
 * @returns Base64url-encoded HMAC-SHA256 digest
 */
export function deriveEnterpriseSalt(baseSalt: string, enterpriseId: string): string {
  const keyBits = sjcl.codec.base64url.toBits(baseSalt);
  const dataBits = sjcl.codec.utf8String.toBits(enterpriseId);
  const resultBits = new sjcl.misc.hmac(keyBits, sjcl.hash.sha256).mac(dataBits);
  return sjcl.codec.base64url.fromBits(resultBits);
}
