import { Ed25519KeyPair } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { DefaultKeys, KeyPairOptions } from '../baseCoin/iface';

export class KeyPair extends Ed25519KeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new NotImplementedError('recordKeysFromPrivateKeyInProtocolFormat not implemented');
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    throw new NotImplementedError('recordKeysFromPublicKeyInProtocolFormat not implemented');
  }

  /** @inheritdoc */
  getKeys(): string {
    throw new NotImplementedError('getKeys not implemented');
  }

  /** @inheritdoc */
  getAddress(): string {
    throw new NotImplementedError('getAddress not implemented');
  }
}
