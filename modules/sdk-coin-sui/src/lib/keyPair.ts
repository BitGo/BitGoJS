import { DefaultKeys, Ed25519KeyPair, KeyPairOptions, toUint8Array } from '@bitgo/sdk-core';
import * as sha3 from 'js-sha3';
import utils from './utils';
import bs58 from 'bs58';
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
    // We don't use private keys for SUI since it's implemented for TSS.
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    pub = Buffer.from(new Uint8Array(bs58.decode(pub))).toString('hex');
    if (!utils.isValidPublicKey(pub)) {
      throw new Error(`Invalid Public Key ${pub}`);
    }

    return { pub };
  }

  /** @inheritdoc */
  getAddress(): string {
    const PUBLIC_KEY_SIZE = 32;
    const tmp = new Uint8Array(PUBLIC_KEY_SIZE + 1);
    const pubBuf = Buffer.from(this.keyPair.pub, 'hex');
    tmp.set([0x00]);
    tmp.set(pubBuf, 1);
    // prefix with 0x to normalize address
    return '0x'.concat(sha3.sha3_256(tmp).slice(0, 40));
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
