import * as sjcl from '@bitgo/sjcl';
import type { SjclCodecs, SjclHashes, SjclMisc } from '@bitgo/sjcl';

type SjclType = {
  hash: SjclHashes;
  codec: SjclCodecs;
  misc: SjclMisc;
};

/**
 * Derives an enterprise-scoped PRF salt to prevent cross-enterprise key reuse.
 *
 * Computes HMAC-SHA256(key=prfSalt_base64url_decoded, data=enterpriseId_utf8).
 * The baseSalt must always come from the server — never generate it client-side.
 *
 * @param baseSalt - Server-provided base64url-encoded PRF salt
 * @param enterpriseId - Enterprise identifier
 * @returns Base64-encoded HMAC-SHA256 digest
 */
export function deriveEnterpriseSalt(baseSalt: string, enterpriseId: string): string {
  const { misc, codec, hash } = sjcl as unknown as SjclType;

  const keyBits = codec.base64url.toBits(baseSalt);
  const dataBits = codec.utf8String.toBits(enterpriseId);

  const hmacInstance = new misc.hmac(keyBits, hash.sha256);
  const resultBits = hmacInstance.mac(dataBits);

  return codec.base64.fromBits(resultBits);
}
