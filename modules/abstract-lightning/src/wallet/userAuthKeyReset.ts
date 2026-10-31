import { createHash } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const VERIFICATION_CODE_LENGTH = 10;
const VERIFICATION_CODE_PREFIX = 'lightning-userauth-reset:v1:';

/**
 * Computes the short verification code a customer reads to support when they reset their userAuth key.
 *
 * code = first 10 characters of the RFC 4648 base32 encoding (uppercase, no padding) of
 * SHA-256("lightning-userauth-reset:v1:" + walletId + ":" + newUserAuthKeyPub),
 * displayed as `XXXXX-XXXXX`.
 *
 * The browser, lightning-services and bitgo-admin must all produce byte-identical output, so keep this
 * function the single implementation. It is pure: it never contacts a server.
 *
 * @param walletId id of the lightning wallet being reset
 * @param newUserAuthKeyPub the new userAuth public key (xpub)
 * @returns the display form, e.g. `K7Q2M-ZP4XA`
 */
export function computeUserAuthResetVerificationCode(walletId: string, newUserAuthKeyPub: string): string {
  const digest = createHash('sha256')
    .update(`${VERIFICATION_CODE_PREFIX}${walletId}:${newUserAuthKeyPub}`, 'utf8')
    .digest();

  let code = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of digest) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5 && code.length < VERIFICATION_CODE_LENGTH) {
      bits -= 5;
      code += BASE32_ALPHABET[(buffer >>> bits) & 31];
    }
    // keep the buffer small; only the unconsumed low bits matter
    buffer &= (1 << bits) - 1;
    if (code.length === VERIFICATION_CODE_LENGTH) {
      break;
    }
  }
  return `${code.slice(0, VERIFICATION_CODE_LENGTH / 2)}-${code.slice(VERIFICATION_CODE_LENGTH / 2)}`;
}

/**
 * Compares two verification codes the way a human types them: case-insensitive, ignoring dashes and spaces.
 */
export function compareUserAuthResetVerificationCodes(left: string, right: string): boolean {
  const [normalizedLeft, normalizedRight] = [left, right].map((code) => code.replace(/[-\s]/g, '').toUpperCase());
  return normalizedLeft === normalizedRight;
}
