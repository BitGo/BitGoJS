/* eslint-disable no-unused-vars */
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
    const result: DefaultKeys = { pub: this.keyPair.pub };

    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }

    return result;
  }

  /**
   * Getting the base64 private key for signing an algo transaction.
   *
   * @returns {Uint8Array} base64 private key
   * @see https://developer.algorand.org/docs/features/accounts/#transformation-private-key-to-base64-private-key
   */
  getSigningKey(): Uint8Array {
    return utils.toUint8Array(this.keyPair.prv + this.keyPair.pub);
  }
}
