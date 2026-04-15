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
import { bip32, ECPair } from '@bitgo/secp256k1';
import { randomBytes } from 'crypto';
import { pubKeyToKaspaAddress, isValidPrivateKey } from './utils';
import { MAINNET_PREFIX, TESTNET_PREFIX } from './constants';

const DEFAULT_SEED_SIZE_BYTES = 16;

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
   * Build a keypair from a private key or extended private key.
   *
   * @param {string} prv A raw private key
   */
  recordKeysFromPrivateKey(prv: string): void {
    if (!isValidPrivateKey(prv)) {
      throw new Error('Unsupported private key');
    }
    if (isValidXprv(prv)) {
      this.hdNode = bip32.fromBase58(prv);
    } else {
      this.keyPair = ECPair.fromPrivateKey(Buffer.from(prv.slice(0, 64), 'hex'));
    }
  }

  /**
   * Build an ECPair from a public key or extended public key.
   *
   * @param {string} pub A raw public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (isValidXpub(pub)) {
      this.hdNode = bip32.fromBase58(pub);
    } else {
      this.keyPair = ECPair.fromPublicKey(Buffer.from(pub, 'hex'));
    }
  }

  /**
   * Default keys format is a pair of hex keys.
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
   * Get a Kaspa address from this key pair.
   *
   * @returns {string} The bech32-encoded Kaspa address
   */
  getAddress(network = 'mainnet'): string {
    const hrp = network === 'testnet' ? TESTNET_PREFIX : MAINNET_PREFIX;
    const compressedPub = this.getPublicKey({ compressed: true });
    return pubKeyToKaspaAddress(compressedPub, hrp);
  }
}
