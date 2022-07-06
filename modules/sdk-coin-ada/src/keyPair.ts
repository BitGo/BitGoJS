import { DefaultKeys, KeyPairOptions, Ed25519KeyPair, AddressFormat } from '@bitgo/sdk-core';

export class KeyPair extends Ed25519KeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   *
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  getAddress(format?: AddressFormat): string {
    throw new Error('Method not implemented.');
  }

  getKeys(): DefaultKeys {
    throw new Error('Method not implemented.');
  }

  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new Error('Method not implemented.');
  }
  recordKeysFromPublicKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new Error('Method not implemented.');
  }
}
