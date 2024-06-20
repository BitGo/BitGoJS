import * as stellar from 'stellar-sdk';
import { DefaultKeys, Ed25519KeyPair, InvalidKey, KeyPairOptions } from '@bitgo/sdk-core';
import { decodePrivateKey, decodePublicKey, encodePrivateKey, encodePublicKey } from './utils';

export class KeyPair extends Ed25519KeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  getKeys(raw = false): DefaultKeys {
    const publicKey = encodePublicKey(Buffer.from(this.keyPair.pub, 'hex'));
    const result: DefaultKeys = {
      pub: raw ? decodePublicKey(publicKey).toString('hex') : publicKey,
    };

    if (this.keyPair.prv) {
      const privateKey = encodePrivateKey(Buffer.from(this.keyPair.prv, 'hex'));
      result.prv = raw ? decodePrivateKey(privateKey).toString('hex') : privateKey;
    }

    return result;
  }

  /** @inheritdoc */
  getAddress(): string {
    return encodePublicKey(Buffer.from(this.keyPair.pub, 'hex'));
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    try {
      const publicKey = decodePublicKey(pub);
      return { pub: publicKey.toString('hex') };
    } catch (e) {
      throw new InvalidKey('Invalid public key: ' + pub);
    }
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    try {
      const kp = stellar.Keypair.fromSecret(prv);
      const publicKey = decodePublicKey(kp.publicKey());
      const privateKey = decodePrivateKey(kp.secret());
      return {
        pub: publicKey.toString('hex'),
        prv: privateKey.toString('hex'),
      };
    } catch (e) {
      throw new InvalidKey('Invalid private key: ' + prv);
    }
  }
}
