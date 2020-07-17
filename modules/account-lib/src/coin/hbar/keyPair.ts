import { Ed25519KeyPair } from '../baseCoin/ed25519KeyPair';
import { KeyPairOptions, ByteKeys } from '../baseCoin/iface';

export class KeyPair extends Ed25519KeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key (extended or raw), or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /**
   * Ethereum default keys format is raw private and uncompressed public key
   *
   * @returns { ByteKeys } The keys in the protocol default key format
   */
  getKeys(): ByteKeys {
    return super.getKeys();
  }
}
