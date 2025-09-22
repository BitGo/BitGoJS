import { DefaultKeys, Ed25519KeyPair, isBase58, KeyPairOptions, toHex, toUint8Array } from '@bitgo-beta/sdk-core';
import { KeyCurve } from '@bitgo-beta/statics';
import { Keyring } from '@polkadot/keyring';
import { createPair } from '@polkadot/keyring/pair';
import { KeyringPair } from '@polkadot/keyring/types';
import bs58 from 'bs58';
import utils from './utils';
import * as nacl from 'tweetnacl';

const keyring = new Keyring({ type: KeyCurve.Ed25519 });

export class KeyPair extends Ed25519KeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /**
   * Helper function to create the KeyringPair for signing a substrate transaction.
   * @returns {KeyringPair} KeyringPair
   */
  protected createKeyringPair(): KeyringPair {
    const secretKey = this.keyPair.prv ? new Uint8Array(Buffer.from(this.keyPair.prv, 'hex')) : undefined;
    const publicKey = new Uint8Array(Buffer.from(this.keyPair.pub, 'hex'));
    return createPair({ toSS58: keyring.encodeAddress, type: KeyCurve.Ed25519 }, { secretKey, publicKey });
  }

  /** @inheritdoc */
  getAddress(ss58Format: number): string {
    let encodedAddress = this.createKeyringPair().address;
    encodedAddress = keyring.encodeAddress(encodedAddress, ss58Format);

    return encodedAddress;
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
    const decodedSeed = utils.decodeSeed(prv);
    const bufferFromSeed = Buffer.from(decodedSeed.seed);
    return utils.keyPairFromSeed(bufferFromSeed).keyPair;
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const publicKey = keyring.addFromPair({
      // tss common pub is in base58 format and decodes to length of 32
      publicKey: isBase58(pub, 32) ? new Uint8Array(bs58.decode(pub)) : new Uint8Array(Buffer.from(pub, 'hex')),
      secretKey: new Uint8Array(),
    }).publicKey;
    return { pub: toHex(publicKey) };
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
