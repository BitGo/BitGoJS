import * as crypto from 'crypto';

export function getSeed(s?: string): Buffer {
  if (s === undefined) {
    return crypto.randomBytes(32);
  }
  return crypto.createHash('sha256').update(s).digest();
}
