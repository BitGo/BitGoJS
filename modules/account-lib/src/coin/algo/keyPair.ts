/* eslint-disable no-unused-vars */
import algosdk from 'algosdk';
import { Ed25519KeyPair } from '../baseCoin';
import { NotImplementedError, InvalidKey } from '../baseCoin/errors';
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
    if (!utils.isValidPrivateKey(prv)) {
      throw new InvalidKey('Invalid key');
    }
    return {
      prv: prv,
      pub: '',
    };
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new NotImplementedError('recordKeysFromPublicKeyInProtocolFormat not implemented');
  }

  /** @inheritdoc */
  getAddress(): string {
    return algosdk.encodeAddress(utils.hexStringToUInt8Array(this.keyPair.pub));
  }

  /** @inheritdoc */
  getKeys(): DefaultKeys {
    const result: DefaultKeys = { pub: this.keyPair.pub };

    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }

    return result;
  }
}
