import { Ed25519KeyPair } from '../baseCoin';
import { DefaultKeys, KeyPairOptions } from '../baseCoin/iface';
import * as nearApi from 'near-api-js';
import { toHex } from '../hbar/utils';

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
}
