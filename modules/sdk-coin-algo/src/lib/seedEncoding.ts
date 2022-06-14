import * as base32 from 'hi-base32';
import sha512 from 'js-sha512';
import { Seed } from './ifaces';

const SEED_BYTES_LENGTH = 32;
const ALGORAND_SEED_BYTE_LENGTH = 36;
const ALGORAND_CHECKSUM_BYTE_LENGTH = 4;
const ALGORAND_SEED_LENGTH = 58;

export class SeedEncoding {
  private static genericHash(arr: Uint8Array): number[] {
    return sha512.sha512_256.array(arr);
  }

  /**
   * Checks if a seed is valid
   * @param {String} seed - encoded Algorand seed
   * @returns {Boolean} true if valid, false otherwise
   */
  static isValidSeed(seed: string): boolean {
    if (seed.length !== ALGORAND_SEED_LENGTH) {
      return false;
    }

    // Try to decode
    let decoded: Seed;
    try {
      decoded = SeedEncoding.decode(seed);
    } catch (e) {
      return false;
    }

    // Compute checksum
    const checksum = SeedEncoding.genericHash(decoded.seed).slice(
      SEED_BYTES_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH,
      SEED_BYTES_LENGTH
    );

    // Check if the checksum and the seed are equal
    if (checksum.length !== decoded.checksum.length) {
      return false;
    }
    return checksum.every((val, i) => val === decoded.checksum[i]);
  }

  /**
   * Decode a seed
   *
   * @param seed
   * @return {{checksum: Uint8Array, seed: Uint8Array}}
   */
  static decode(seed: string): Seed {
    // try to decode
    const decoded = base32.decode.asBytes(seed);

    // Sanity check
    if (decoded.length !== ALGORAND_SEED_BYTE_LENGTH) throw new Error('seed seems to be malformed');

    return {
      seed: new Uint8Array(decoded.slice(0, ALGORAND_SEED_BYTE_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH)),
      checksum: new Uint8Array(decoded.slice(SEED_BYTES_LENGTH, ALGORAND_SEED_BYTE_LENGTH)),
    };
  }

  /**
   * Encode a secret key into a seed
   *
   * @param secretKey
   * @return {String} encoded seed
   */
  static encode(secretKey: Uint8Array): string {
    // get seed
    const seed = secretKey.slice(0, SEED_BYTES_LENGTH);
    // compute checksum
    const checksum = SeedEncoding.genericHash(seed).slice(
      SEED_BYTES_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH,
      SEED_BYTES_LENGTH
    );
    const arraySeed = new Uint8Array(seed.length + checksum.length);
    arraySeed.set(seed);
    arraySeed.set(checksum, seed.length);
    const encodedSeed = base32.encode(arraySeed);

    return encodedSeed.toString().slice(0, ALGORAND_SEED_LENGTH); // removing the extra '===='
  }
}
