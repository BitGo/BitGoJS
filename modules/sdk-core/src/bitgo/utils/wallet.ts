import * as bs58 from 'bs58';

/**
 * Generate a random password
 * @param   {Number} numWords     Number of 32-bit words
 * @returns {String}          base58 random password
 */
export function generateRandomPassword(numWords: number): string {
  const bytes = new Uint8Array(numWords * 4);
  crypto.getRandomValues(bytes);
  return bs58.encode(bytes);
}
