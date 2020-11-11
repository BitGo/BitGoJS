import * as BLS from '@chainsafe/bls';
import { DefaultKeys } from '../baseCoin/iface';
import { BlsKeyPair } from '../baseCoin/blsKeyPair';

/**
 * Ethereum keys and address management.
 */
export class KeyPair extends BlsKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   */
  constructor() {
    super();
  }

  /**
   * ETH2 default keys format is a pair of Uint8Array keys
   *
   * @returns { DefaultKeys } The keys in the defined format
   */
  getKeys(): BLS.Keypair {
    if (this.keyPair) {
      return this.keyPair;
    }
    throw new Error('KeyPair has not been specified');
  }

  /**
   * Get an Ethereum public address
   *
   * @returns {string} The address derived from the public key
   */
  getAddress(): string {
    return this.getKeys().publicKey.toHexString();
  }
}
