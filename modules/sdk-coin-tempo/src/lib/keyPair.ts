import { DefaultKeys, isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from '@bitgo/sdk-core';
import * as crypto from 'crypto';

/**
 * Tempo keys and address management
 */
export class KeyPair {
  private keyPair: DefaultKeys;

  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    let seed: Buffer;

    if (!source) {
      seed = crypto.randomBytes(32);
    } else if (isSeed(source)) {
      seed = source.seed;
    } else if (isPrivateKey(source)) {
      // TODO: Implement private key to keypair conversion
      throw new Error('Private key import not yet implemented');
    } else if (isPublicKey(source)) {
      // TODO: Implement public key import
      throw new Error('Public key import not yet implemented');
    } else {
      throw new Error('Invalid key pair options');
    }

    // TODO: Generate actual keypair from seed based on the coin's key derivation
    this.keyPair = this.generateKeyPairFromSeed(seed);
  }

  /**
   * Generate a keypair from a seed
   * @param seed
   * @private
   */
  private generateKeyPairFromSeed(seed: Buffer): DefaultKeys {
    // TODO: Implement actual key generation for Tempo
    // This is a placeholder implementation
    const prv = seed.toString('hex');
    const pub = crypto.createHash('sha256').update(seed).digest('hex');

    return {
      prv,
      pub,
    };
  }

  /**
   * Get the public key
   */
  getKeys(): DefaultKeys {
    return this.keyPair;
  }

  /**
   * Get the address
   */
  getAddress(): string {
    // TODO: Implement address derivation from public key
    return this.keyPair.pub;
  }
}
