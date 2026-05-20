import {
  DefaultKeys,
  isPrivateKey,
  isPublicKey,
  isSeed,
  KeyPairOptions,
  Secp256k1ExtendedKeyPair,
} from '@bitgo/sdk-core';
import { bip32 } from '@bitgo/secp256k1';
import { randomBytes } from 'crypto';
import * as xrpl from 'xrpl';
import utils from './utils';

const DEFAULT_SEED_SIZE_BYTES = 32;

/**
 * XRP keys and address management.
 */
export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param {KeyPairOptions} source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
    if (!source) {
      const seed = randomBytes(DEFAULT_SEED_SIZE_BYTES);
      this.hdNode = bip32.fromSeed(seed);
    } else if (isSeed(source)) {
      this.hdNode = bip32.fromSeed(source.seed);
    } else if (isPrivateKey(source)) {
      super.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      super.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }

    if (this.hdNode) {
      this.keyPair = Secp256k1ExtendedKeyPair.toKeyPair(this.hdNode);
    }
  }

  /** @inheritdoc */
  getKeys(): DefaultKeys {
    return {
      pub: this.getPublicKey({ compressed: true }).toString('hex'),
      prv: this.getPrivateKey()?.toString('hex'),
    };
  }

  /** @inheritdoc */
  getAddress(): string {
    return xrpl.deriveAddress(this.getKeys().pub);
  }

  /**
   * Generates a signature for an arbitrary string with the current private key using keccak256
   * hashing algorithm. Throws if there is no private key.
   *
   * @param {string} message to produce a signature for
   * @returns {Buffer} The signature as a buffer
   */
  signMessage(message: string): Buffer {
    const messageToSign = Buffer.from(message).toString('hex');
    const { prv } = this.getKeys();
    if (!prv) {
      throw new Error('Missing private key');
    }
    const signature = utils.signString(messageToSign, prv);
    return Buffer.from(signature, 'hex');
  }

  /**
   * Verifies a message signature using the current public key.
   *
   * @param {string} message signed
   * @param {Buffer} signature to verify
   * @returns {boolean} True if the message was signed with the current key pair
   */
  verifySignature(message: string, signature: Buffer): boolean {
    const messageToVerify = Buffer.from(message).toString('hex');
    const pubKey = this.getKeys().pub;
    return utils.verifySignature(messageToVerify, pubKey, signature.toString('hex'));
  }
}
