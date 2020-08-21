import * as nacl from 'tweetnacl';
import { toHex, toUint8Array } from '../hbar/utils';
import { isValidEd25519PublicKey, isValidEd25519SecretKey, isValidEd25519Seed } from '../../utils/crypto';
import { BaseKeyPair } from './baseKeyPair';
import { AddressFormat } from './enum';
import { isPrivateKey, isPublicKey, isSeed, DefaultKeys, KeyPairOptions } from './iface';

const DEFAULT_SEED_SIZE_BYTES = 32;

export abstract class Ed25519KeyPair implements BaseKeyPair {
  protected keyPair: DefaultKeys;
  protected source?: KeyPairOptions;

  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param {KeyPairOptions} source Either a master seed, a private key, or a public key
   */
  protected constructor(source?: KeyPairOptions) {
    let naclKeyPair;
    if (!source) {
      const seed = nacl.randomBytes(DEFAULT_SEED_SIZE_BYTES);
      naclKeyPair = nacl.sign.keyPair.fromSeed(seed);
      this.setKeyPair(naclKeyPair);
    } else if (isSeed(source)) {
      naclKeyPair = nacl.sign.keyPair.fromSeed(source.seed);
      this.setKeyPair(naclKeyPair);
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }
  }

  private setKeyPair(naclKeyPair: nacl.SignKeyPair): void {
    this.keyPair = {
      prv: toHex(naclKeyPair.secretKey.slice(0, 32)),
      pub: toHex(naclKeyPair.publicKey),
    };
  }

  /** @inheritdoc */
  recordKeysFromPrivateKey(prv: string): void {
    if (isValidEd25519Seed(prv)) {
      const decodedPrv = toUint8Array(prv);
      const naclKeyPair = nacl.sign.keyPair.fromSeed(decodedPrv);
      this.setKeyPair(naclKeyPair);
    } else if (isValidEd25519SecretKey(prv)) {
      const decodedPrv = toUint8Array(prv);
      const naclKeyPair = nacl.sign.keyPair.fromSecretKey(decodedPrv);
      this.setKeyPair(naclKeyPair);
    } else {
      this.keyPair = this.recordKeysFromPrivateKeyInProtocolFormat(prv);
    }
  }

  /** @inheritdoc */
  recordKeysFromPublicKey(pub: string): void {
    if (isValidEd25519PublicKey(pub)) {
      this.keyPair = { pub };
    } else {
      this.keyPair = this.recordKeysFromPublicKeyInProtocolFormat(pub);
    }
  }

  abstract recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys;

  abstract recordKeysFromPublicKeyInProtocolFormat(prv: string): DefaultKeys;

  /** @inheritdoc */
  abstract getAddress(format?: AddressFormat): string;

  /** @inheritdoc */
  abstract getKeys(): any;

  /**
   * Generates a signature for an arbitrary string with the current private key using the ed25519 public-key signature
   * system.
   *
   * @param {string} message to produce a signature for
   * @returns {Uint8Array} The signature produced for the message
   * @throws if there is no private key
   */
  signMessage(message: string): Uint8Array {
    const messageToSign = toUint8Array(Buffer.from(message).toString('hex'));
    const { prv } = this.keyPair;
    if (!prv) {
      throw new Error('Missing private key');
    }
    return nacl.sign.detached(messageToSign, nacl.sign.keyPair.fromSeed(toUint8Array(prv)).secretKey);
  }

  /**
   * Verifies a message signature using the current public key.
   *
   * @param {string} message signed
   * @param {Uint8Array} signature to verify
   * @returns {boolean} True if the message was signed with the current key pair
   */
  verifySignature(message: string, signature: Uint8Array): boolean {
    const messageToVerify = toUint8Array(Buffer.from(message).toString('hex'));
    const publicKey = toUint8Array(this.keyPair.pub);
    return nacl.sign.detached.verify(messageToVerify, signature, publicKey);
  }
}
