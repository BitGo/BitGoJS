/**
 * Kaspa (KAS) Key Pair Management
 *
 * Handles secp256k1 key generation, derivation, and Kaspa address encoding.
 * Kaspa uses Schnorr signatures over secp256k1, with x-only public keys.
 */

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
import { publicKeyToAddress, isValidPublicKey, isValidPrivateKey } from './utils';
import { MAINNET_HRP, TESTNET_HRP } from './constants';

const DEFAULT_SEED_SIZE_BYTES = 32;

export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Create a Kaspa key pair.
   *
   * @param source - Optional seed, private key, or public key
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
   * Build a key pair from a private key hex string or extended private key.
   */
  recordKeysFromPrivateKey(prv: string): void {
    if (!isValidPrivateKey(prv) && !isValidXprv(prv)) {
      if (!/^[0-9a-fA-F]{64}$/.test(prv)) {
        throw new Error('Unsupported private key format');
      }
    }
    if (isValidXprv(prv)) {
      this.hdNode = bip32.fromBase58(prv);
    } else {
      this.keyPair = ECPair.fromPrivateKey(Buffer.from(prv.slice(0, 64), 'hex'));
    }
  }

  /**
   * Build a key pair from a public key hex string or extended public key.
   */
  recordKeysFromPublicKey(pub: string): void {
    if (isValidXpub(pub)) {
      this.hdNode = bip32.fromBase58(pub);
      return;
    }
    if (!isValidPublicKey(pub)) {
      throw new Error('Unsupported public key format');
    }
    let pubBytes = Buffer.from(pub, 'hex');
    // If x-only (32 bytes), assume even y (0x02 prefix)
    if (pubBytes.length === 32) {
      pubBytes = Buffer.concat([Buffer.from([0x02]), pubBytes]);
    }
    this.keyPair = ECPair.fromPublicKey(pubBytes);
  }

  /**
   * Get keys in default format: compressed public key and optional private key (both hex).
   */
  getKeys(): DefaultKeys {
    return {
      pub: this.getPublicKey({ compressed: true }).toString('hex'),
      prv: this.getPrivateKey()?.toString('hex'),
    };
  }

  /**
   * Get the Kaspa mainnet address for this key pair.
   * @param format - Ignored; Kaspa always uses bech32m mainnet encoding by default
   */
  getAddress(format?: unknown): string {
    const networkType = (format as string) === 'testnet' ? 'testnet' : 'mainnet';
    const hrp = networkType === 'mainnet' ? MAINNET_HRP : TESTNET_HRP;
    const compressedPub = this.getPublicKey({ compressed: true });
    return publicKeyToAddress(Buffer.from(compressedPub), hrp);
  }

  /**
   * Get the x-only public key (32 bytes, just the x-coordinate of secp256k1 point).
   * Used for Kaspa Schnorr signing and P2PK script construction.
   */
  getXOnlyPublicKey(): Buffer {
    const compressedPub = this.getPublicKey({ compressed: true });
    // Strip the 0x02/0x03 prefix byte
    return Buffer.from(compressedPub).slice(1);
  }
}
