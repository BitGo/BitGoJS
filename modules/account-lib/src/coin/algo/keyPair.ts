import { encodeAddress } from 'algosdk';
import { Ed25519KeyPair } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { DefaultKeys, KeyPairOptions } from '../baseCoin/iface';
import utils from './utils';

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
  recordKeysFromPublicKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new NotImplementedError('recordKeysFromPublicKeyInProtocolFormat not implemented');
  }

  /** @inheritdoc */
  getAddress(): string {
    return encodeAddress(utils.hexStringToUInt8Array(this.keyPair.pub));
  }

  /** @inheritdoc */
  getKeys(): DefaultKeys {
    const result: DefaultKeys = { pub: this.keyPair.pub.toString() };

    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv.toString();
    }

    return result;
  }
}
