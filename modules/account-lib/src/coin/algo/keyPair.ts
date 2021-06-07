/* eslint-disable no-unused-vars */
import { PrivateKey, PublicKey } from '@hashgraph/sdk';
import { encodeAddress } from 'algosdk';
import { Ed25519KeyPair } from '../baseCoin';
import { OddPrivateKeyValidationError, PrivateKeyValidationError, PublicKeyValidationError } from './errors';
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
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    try {
      const ed25519Pub = PublicKey.fromString(pub.toLowerCase()).toString();
      return { pub: ed25519Pub };
    } catch (e) {
      throw new PublicKeyValidationError(pub);
    }
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    if (!/^([a-f0-9]{2})+$/i.test(prv)) {
      throw new OddPrivateKeyValidationError();
    }
    try {
      const hederaPrv = PrivateKey.fromString(prv);
      const ed25519Prv = hederaPrv.toString();
      const ed25519Pub = hederaPrv.publicKey.toString();
      return {
        prv: ed25519Prv,
        pub: ed25519Pub,
      };
    } catch (e) {
      throw new PrivateKeyValidationError(prv);
    }
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
}
