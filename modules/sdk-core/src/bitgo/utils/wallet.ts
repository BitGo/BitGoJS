import * as sjcl from '@bitgo/sjcl';
import * as bs58 from 'bs58';

/**
 * Generate a random password
 * @param   {Number} numWords     Number of 32-bit words
 * @returns {String}          base58 random password
 */
export function generateRandomPassword(numWords: number): string {
  const bytes = sjcl.codec.bytes.fromBits(sjcl.random.randomWords(numWords));
  return bs58.encode(bytes);
}
