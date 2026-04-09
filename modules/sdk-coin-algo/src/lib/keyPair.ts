import algosdk, { encodeAddress } from 'algosdk';
import { Ed25519KeyPair, DefaultKeys, KeyPairOptions, InvalidKey } from '@bitgo/sdk-core';
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
    const decodedSeed = utils.decodeSeed(prv);
    const bufferFromSeed = Buffer.from(decodedSeed.seed);

    return utils.keyPairFromSeed(bufferFromSeed).keyPair;
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const publicKey = algosdk.decodeAddress(pub).publicKey;
    return { pub: utils.toHex(publicKey) };
  }

  /** @inheritdoc */
  getAddress(): string {
    return encodeAddress(utils.toUint8Array(this.keyPair.pub));
  }

  /** @inheritdoc */
  getKeys(): DefaultKeys {
    // TODO(https://bitgoinc.atlassian.net/browse/STLX-6062): refactor this method
    // should return the pub and prv in the Algorand encoded format
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
    if (!this.keyPair.prv) {
      throw new InvalidKey('Private key undefined');
    }
    return utils.toUint8Array(this.keyPair.prv + this.keyPair.pub);
  }
}
