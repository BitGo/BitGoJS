import { DefaultKeys, Ed25519KeyPair } from '@bitgo/sdk-core';

export class KeyPair extends Ed25519KeyPair {
  /** @inheritdoc */
  getKeys(): DefaultKeys {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  getAddress(): string {
    throw new Error('Method not implemented.');
  }
}
