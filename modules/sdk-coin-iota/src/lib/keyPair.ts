import { DefaultKeys, Ed25519KeyPair, KeyPairOptions } from '@bitgo/sdk-core';
import utils from './utils';

/**
 * IOTA KeyPair implementation using Ed25519 cryptography.
 *
 * This class extends the Ed25519KeyPair base class and provides IOTA-specific
 * key pair functionality. It's primarily used for TSS (Threshold Signature Scheme)
 * operations where private keys are managed through multi-party computation.
 *
 * @example
 * ```typescript
 * // Generate a random key pair
 * const keyPair = new KeyPair();
 *
 * // Generate from a seed
 * const keyPair = new KeyPair({ seed: Buffer.from('...') });
 *
 * // Generate from a public key
 * const keyPair = new KeyPair({ pub: '8c26e54e36c902c5...' });
 *
 * // Get the IOTA address
 * const address = keyPair.getAddress();
 * ```
 */
export class KeyPair extends Ed25519KeyPair {
  /**
   * Creates a new IOTA key pair.
   *
   * @param source - Optional configuration for key pair generation:
   *   - seed: Buffer - Generate deterministic key pair from seed
   *   - prv: string - Import from private key (not used for TSS)
   *   - pub: string - Import from public key only
   *   - If omitted, generates a random key pair
   *
   * @example
   * ```typescript
   * // Random key pair
   * const randomKeyPair = new KeyPair();
   *
   * // From seed (deterministic)
   * const deterministicKeyPair = new KeyPair({
   *   seed: Buffer.from('my-seed-phrase')
   * });
   *
   * // From public key only (for verification)
   * const verificationKeyPair = new KeyPair({
   *   pub: '8c26e54e36c902c5452e8b44e28abc5aaa6c3faaf12b4c0e8a38b4c9da0c0a6a'
   * });
   * ```
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /**
   * Returns the key pair as a DefaultKeys object.
   * Always includes the public key, and includes the private key if available.
   *
   * @returns Object containing pub (always) and prv (if available)
   *
   * @example
   * ```typescript
   * const keyPair = new KeyPair();
   * const keys = keyPair.getKeys();
   * console.log(keys.pub); // '8c26e54e...'
   * console.log(keys.prv); // '1a2b3c...' or undefined
   * ```
   */
  getKeys(): DefaultKeys {
    const result: DefaultKeys = { pub: this.keyPair.pub };

    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }

    return result;
  }

  /**
   * Records keys from a private key in protocol format.
   *
   * **Not implemented for IOTA.**
   *
   * IOTA uses TSS (Threshold Signature Scheme) where private keys are never
   * reconstructed in full. Instead, key shares are distributed across multiple
   * parties and signing is performed through multi-party computation.
   *
   * @param prv - The private key (unused)
   * @throws Error always - method not supported for TSS-based signing
   */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new Error('Method not implemented. IOTA uses TSS and does not reconstruct private keys.');
  }

  /**
   * Records keys from a public key in protocol format.
   * Validates the public key and returns it in the DefaultKeys format.
   *
   * @param pub - The Ed25519 public key (hex string)
   * @returns DefaultKeys object containing only the public key
   * @throws Error if the public key is invalid
   *
   * @example
   * ```typescript
   * const keys = keyPair.recordKeysFromPublicKeyInProtocolFormat(
   *   '8c26e54e36c902c5452e8b44e28abc5aaa6c3faaf12b4c0e8a38b4c9da0c0a6a'
   * );
   * console.log(keys.pub); // '8c26e54e...'
   * console.log(keys.prv); // undefined
   * ```
   */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    if (!utils.isValidPublicKey(pub)) {
      throw new Error(`Invalid Public Key: ${pub}`);
    }
    return { pub };
  }

  /**
   * Derives the IOTA address from this key pair's public key.
   * Uses the IOTA-specific address derivation algorithm.
   *
   * @returns The IOTA address (64-character hex string with 0x prefix)
   *
   * @example
   * ```typescript
   * const keyPair = new KeyPair();
   * const address = keyPair.getAddress();
   * console.log(address); // '0x9882188ba3e8070a9bb06ae9446cf607914ee8ee...'
   * ```
   */
  getAddress(): string {
    return utils.getAddressFromPublicKey(this.keyPair.pub);
  }
}
