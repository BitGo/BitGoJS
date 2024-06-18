import * as stellar from 'stellar-sdk';
import { DefaultKeys, Ed25519KeyPair, KeyPairOptions, NotImplementedError } from '@bitgo/sdk-core';

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
    const publicKey = stellar.StrKey.encodeEd25519PublicKey(Buffer.from(this.keyPair.pub, 'hex'));
    const result: DefaultKeys = {
      pub: raw ? stellar.StrKey.decodeEd25519PublicKey(publicKey).toString('hex') : publicKey,
    };

    if (this.keyPair.prv) {
      const privateKey = stellar.StrKey.encodeEd25519SecretSeed(Buffer.from(this.keyPair.prv, 'hex'));
      result.prv = raw ? stellar.StrKey.decodeEd25519SecretSeed(privateKey).toString('hex') : privateKey;
    }

    return result;
  }

  /** @inheritdoc */
  getAddress(): string {
    throw NotImplementedError;
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const publicKey = stellar.StrKey.decodeEd25519PublicKey(pub);
    return { pub: publicKey.toString('hex') };
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    const kp = stellar.Keypair.fromSecret(prv);
    const publicKey = stellar.StrKey.decodeEd25519PublicKey(kp.publicKey());
    const privateKey = stellar.StrKey.decodeEd25519SecretSeed(kp.secret());
    return {
      pub: publicKey.toString('hex'),
      prv: privateKey.toString('hex'),
    };
  }
}
