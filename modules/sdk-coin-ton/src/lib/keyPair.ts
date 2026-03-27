import { DefaultKeys, Ed25519KeyPair, KeyPairOptions, toUint8Array } from '@bitgo/sdk-core';
import { encodeAddress } from '@bitgo/wasm-ton';
import utils from './utils';
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
  getKeys(): DefaultKeys {
    const result: DefaultKeys = { pub: this.keyPair.pub };
    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }
    return result;
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    if (!utils.isValidPublicKey(pub)) {
      throw new Error(`Invalid Public Key ${pub}`);
    }

    return { pub };
  }

  /** @inheritdoc */
  getAddress(): string {
    const pubKeyBytes = Buffer.from(this.keyPair.pub, 'hex');
    return encodeAddress(pubKeyBytes, true);
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
