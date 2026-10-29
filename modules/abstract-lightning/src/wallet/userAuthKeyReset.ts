import { createHash } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function computeUserAuthResetVerificationCode(walletId: string, newUserAuthKeyPub: string): string {
  const digest = createHash('sha256')
    .update(`lightning-userauth-reset:v1:${walletId}:${newUserAuthKeyPub}`, 'utf8')
    .digest();
  let bits = 0;
  let value = 0;
  let code = '';
  for (const byte of digest) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5 && code.length < 10) {
      bits -= 5;
      code += BASE32_ALPHABET[(value >>> bits) & 31];
    }
    if (code.length === 10) {
      break;
    }
  }
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

export function compareUserAuthResetVerificationCodes(left: string, right: string): boolean {
  const normalize = (code: string): string => code.replace(/[- ]/g, '').toUpperCase();
  return normalize(left) === normalize(right);
}
