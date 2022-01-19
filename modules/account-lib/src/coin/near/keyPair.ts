import { Ed25519KeyPair } from '../baseCoin';
import { DefaultKeys, KeyPairOptions } from '../baseCoin/iface';
import * as nearApi from "near-api-js"
import * as bs58 from 'bs58'

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
    const keyPair = nearApi.KeyPair.fromString(prv)
    return { pub: keyPair.getPublicKey().toString().slice(8),
      prv: prv}
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const pubKey = nearApi.utils.PublicKey.from(pub)
    return { pub: pubKey.toString()}
  }

  /** @inheritdoc */
  getAddress(): string {
    return bs58.decode(this.getKeys().pub.toString()).toString("hex")
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
