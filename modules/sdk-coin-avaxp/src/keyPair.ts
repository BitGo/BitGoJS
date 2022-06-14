import {
  DefaultKeys,
  isPrivateKey,
  isPublicKey,
  isSeed,
  isValidXprv,
  isValidXpub,
  KeyPairOptions,
  Secp256k1ExtendedKeyPair,
} from '@bitgo/sdk-core';
import { Buffer as BufferAvax } from 'avalanche';
import { SECP256k1KeyPair } from 'avalanche/dist/common';
import { bech32 } from 'bech32';
import * as bip32 from 'bip32';
import { ECPair } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import utils from './utils';

const DEFAULT_SEED_SIZE_BYTES = 16;
export const testnet = 'fuji';
export const mainnet = 'avax';

export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
    if (!source) {
      const seed = randomBytes(DEFAULT_SEED_SIZE_BYTES);
      this.hdNode = bip32.fromSeed(seed);
    } else if (isSeed(source)) {
      this.hdNode = bip32.fromSeed(source.seed);
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }

    if (this.hdNode) {
      this.keyPair = Secp256k1ExtendedKeyPair.toKeyPair(this.hdNode);
    }
  }

  /**
   * Build a keypair from a protocol private key or extended private key.
   *
   * @param {string} prv A raw private key
   */
  recordKeysFromPrivateKey(prv: string): void {
    if (!utils.isValidPrivateKey(prv)) {
      throw new Error('Unsupported private key');
    }
    if (isValidXprv(prv)) {
      this.hdNode = bip32.fromBase58(prv);
    } else {
      this.keyPair = ECPair.fromPrivateKey(Buffer.from(prv.slice(0, 64), 'hex'));
    }
  }

  /**
   * Build an ECPair from a protocol public key or extended public key.
   *
   * @param {string} pub A raw public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (!utils.isValidPublicKey(pub)) {
      throw new Error('Unsupported public key');
    }
    if (isValidXpub(pub)) {
      this.hdNode = bip32.fromBase58(pub);
    } else {
      this.keyPair = ECPair.fromPublicKey(Buffer.from(pub, 'hex'));
    }
  }

  /**
   * Default keys format is a pair of Uint8Array keys
   *
   * @returns { DefaultKeys } The keys in the defined format
   */
  getKeys(): DefaultKeys {
    return {
      pub: this.getPublicKey({ compressed: true }).toString('hex'),
      prv: this.getPrivateKey()?.toString('hex'),
    };
  }

  /**
   * Get an Avalanche P-Chain public mainnet address
   *
   * @returns {string} The mainnet address derived from the public key
   */
  getAddress(format: string = mainnet): string {
    return this.getAvaxPAddress(format);
  }

  /**
   * Get a public address of public key.
   *
   * @param {string} hrp - select Mainnet(avax) or Testnet(fuji) for the address
   * @returns {string} The address derived from the public key and hrp
   */
  getAvaxPAddress(hrp: string): string {
    const publicKey = BufferAvax.from(this.getKeys().pub, 'hex');
    const addrressBuffer: BufferAvax = SECP256k1KeyPair.addressFromPublicKey(publicKey);
    return bech32.encode(hrp, bech32.toWords(addrressBuffer));
  }
}
