/* eslint-disable no-unused-vars */
import algosdk, { encodeAddress } from 'algosdk';
import { Ed25519KeyPair } from '../baseCoin';
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
    const decodedSeed = utils.decodeSeed(prv);
    const hexSecretKey = Buffer.from(decodedSeed.seed);

    return utils.keyPairFromSeed(hexSecretKey).keyPair;
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const publicKey = algosdk.decodeAddress(pub).publicKey;
    return { pub: utils.toHex(publicKey) };
  }

  /** @inheritdoc */
  getAddress(): string {
    return encodeAddress(utils.hexStringToUInt8Array(this.keyPair.pub));
  }

  /** @inheritdoc */
  getKeys(): DefaultKeys {
    // TODO(https://bitgoinc.atlassian.net/browse/STLX-6062): refactor this method
    // should return the pub and prv in the Algorand encoded format
    const result: DefaultKeys = { pub: utils.encodeAddress(Buffer.from(this.keyPair.pub, 'hex')) };

    if (this.keyPair.prv) {
      result.prv = utils.encodeAddress(Buffer.from(this.keyPair.prv, 'hex'));
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
