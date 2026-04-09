import { DefaultKeys, KeyPairOptions, Ed25519KeyPair, toHex, toUint8Array } from '@bitgo/sdk-core';
import * as nearApi from 'near-api-js';
import * as nacl from 'tweetnacl';

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
    const rawPrv = new Uint8Array(nearApi.utils.serialize.base_decode(prv));
    return new KeyPair({ prv: toHex(rawPrv) }).keyPair;
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const rawPub = new Uint8Array(nearApi.utils.serialize.base_decode(pub));
    return { pub: toHex(rawPub) };
  }

  /** @inheritdoc */
  getAddress(): string {
    return this.keyPair.pub;
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
   *  Sign the message in Uint8Array
   *
   * @param {Uint8Array} message to be signed
   * @returns {Uint8Array} signed message
   */

  signMessageinUint8Array(message: Uint8Array): Uint8Array {
    const { prv } = this.keyPair;
    if (!prv) {
      throw new Error('Missing private key');
    }
    return nacl.sign.detached(message, nacl.sign.keyPair.fromSeed(toUint8Array(prv)).secretKey);
  }
}
