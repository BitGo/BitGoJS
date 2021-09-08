import { Ed25519KeyPair } from '../baseCoin';
import { AddressFormat } from '../baseCoin/enum';
import { NotImplementedError } from '../baseCoin/errors';
import { DefaultKeys, KeyPairOptions } from '../baseCoin/iface';

export class KeyPair extends Ed25519KeyPair {
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new NotImplementedError('recordKeysFromPrivateKeyInProtocolFormat not implemented');
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new NotImplementedError('recordKeysFromPublicKeyInProtocolFormat not implemented');
  }

  /** @inheritdoc */
  getAddress(format: AddressFormat): string {
    throw new NotImplementedError('getAddress not implemented');
  }

  /** @inheritdoc */
  getKeys(): void {
    throw new NotImplementedError('getKeys not implemented');
  }
}
