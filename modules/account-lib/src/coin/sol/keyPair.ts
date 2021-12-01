import { Keypair as SolKeypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { BaseKeyPair } from '../baseCoin';
import { InvalidKey } from '../baseCoin/errors';
import { DefaultKeys, isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from '../baseCoin/iface';
import { SEED_LENGTH } from './constants';
import { SolanaKeys } from './iface';
import { base58ToUint8Array, isValidPrivateKey, isValidPublicKey, Uint8ArrayTobase58 } from './utils';

// The Solana Key Pair is an ED25519 but the current ED25519 implementation doesnt return base58 strings
// TODO(): Refactor to ED25519 Keypair instead of BaseKeyPair
export class KeyPair implements BaseKeyPair {
  protected keyPair: DefaultKeys;
  protected source?: KeyPairOptions;
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    let kp: SolKeypair;
    if (!source) {
      kp = SolKeypair.generate();
      this.setKP(kp);
    } else if (isSeed(source)) {
      kp = SolKeypair.fromSeed(source.seed.slice(0, SEED_LENGTH));
      this.setKP(kp);
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }
  }

  private setKP(keyPair: SolKeypair): void {
    this.keyPair = {
      prv: Uint8ArrayTobase58(keyPair.secretKey),
      pub: keyPair.publicKey.toString(),
    };
  }

  /** @inheritdoc */
  recordKeysFromPrivateKey(prv: string): void {
    if (isValidPrivateKey(prv)) {
      const prvKey = base58ToUint8Array(prv);
      const keyPair = SolKeypair.fromSecretKey(prvKey);
      this.setKP(keyPair);
    } else {
      throw new InvalidKey('Invalid private key');
    }
  }

  /** @inheritdoc */
  recordKeysFromPublicKey(pub: string): void {
    if (isValidPublicKey(pub)) {
      this.keyPair = { pub };
    } else {
      throw new InvalidKey('Invalid public key: ' + pub);
    }
  }

  /**
   * Solana default keys format public key as a base58 string and secret key as Uint8Array
   *
   * @param {boolean} raw defines if the prv key is returned in Uint8Array, default is base58
   * @returns {SolanaKeys} The keys in the defined format
   */
  getKeys(raw = false): SolanaKeys {
    const result: SolanaKeys = { pub: this.keyPair.pub };
    if (!!this.keyPair.prv) {
      if (raw) {
        result.prv = base58ToUint8Array(this.keyPair.prv);
      } else {
        result.prv = this.keyPair.prv;
      }
    }
    return result;
  }

  /** @inheritdoc */
  getAddress(): string {
    const keys = this.getKeys();
    return keys.pub;
  }

  /**
   * Generates a signature for an arbitrary string with the current private key using the ed25519 public-key signature
   * system.
   *
   * @param {string} message to produce a signature for
   * @returns {Uint8Array} The signature produced for the message
   * @throws if there is no private key
   */
  signMessage(message: string): Uint8Array {
    const messageToSign = new Uint8Array(Buffer.from(message));
    const { prv } = this.keyPair;
    if (!prv) {
      throw new Error('Missing private key');
    }
    return nacl.sign.detached(messageToSign, base58ToUint8Array(prv));
  }

  /**
   * Verifies a message signature using the current public key.
   *
   * @param {string} message signed
   * @param {Uint8Array} signature to verify
   * @returns {boolean} True if the message was signed with the current key pair
   */
  verifySignature(message: Uint8Array | string, signature: Uint8Array): boolean {
    let messageToVerify;
    if (typeof message === 'string') {
      messageToVerify = new Uint8Array(Buffer.from(message));
    } else {
      messageToVerify = message;
    }
    const pub = new PublicKey(this.keyPair.pub);
    return nacl.sign.detached.verify(messageToVerify, signature, pub.toBuffer());
  }
}
