/**
 * Proton (XPR Network) key pair management using @greymass/eosio
 */

import { DefaultKeys, isPrivateKey, isPublicKey, isSeed, KeyPairOptions, AddressFormat } from '@bitgo/sdk-core';
import { PrivateKey, PublicKey, KeyType } from '@greymass/eosio';
import { randomBytes } from 'crypto';

/**
 * Proton (XPR Network) key pair class
 * Uses secp256k1 keys (K1 type) as used by EOSIO/Antelope chains
 */
export class KeyPair {
  private _privateKey?: PrivateKey;
  private _publicKey: PublicKey;

  /**
   * Public constructor. Creates a key pair from various sources.
   *
   * @param source - Either a seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    if (!source) {
      // Generate a new random keypair
      this._privateKey = PrivateKey.generate(KeyType.K1);
      this._publicKey = this._privateKey.toPublic();
    } else if (isSeed(source)) {
      // Create keypair from seed (32 bytes)
      this._privateKey = this.privateKeyFromSeed(source.seed);
      this._publicKey = this._privateKey.toPublic();
    } else if (isPrivateKey(source)) {
      // Import from private key string
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      // Import from public key string
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }
  }

  /**
   * Create a private key from a 32-byte seed
   *
   * @param seed - 32-byte seed buffer
   * @returns PrivateKey object
   */
  private privateKeyFromSeed(seed: Buffer): PrivateKey {
    if (seed.length !== 32) {
      // If seed is not 32 bytes, hash it to get 32 bytes
      const cryptoModule = require('crypto');
      seed = cryptoModule.createHash('sha256').update(seed).digest();
    }
    // Convert raw bytes to WIF format, then create PrivateKey from WIF
    // WIF encoding: 0x80 prefix + raw key + double SHA256 checksum (4 bytes)
    const cryptoModule = require('crypto');
    const bs58 = require('bs58');

    const prefixed = Buffer.concat([Buffer.from([0x80]), seed]);
    const hash1 = cryptoModule.createHash('sha256').update(prefixed).digest();
    const hash2 = cryptoModule.createHash('sha256').update(hash1).digest();
    const checksum = hash2.slice(0, 4);
    const wif = Buffer.concat([prefixed, checksum]);
    const wifString = bs58.encode(wif);

    return PrivateKey.from(wifString);
  }

  /**
   * Record keys from a private key string
   *
   * @param prv - Private key in PVT_K1_ format or WIF format
   */
  private recordKeysFromPrivateKey(prv: string): void {
    try {
      // Check if it's a raw hex string (64 characters)
      if (/^[a-fA-F0-9]{64}$/.test(prv)) {
        const seed = Buffer.from(prv, 'hex');
        this._privateKey = this.privateKeyFromSeed(seed);
      } else {
        // Try parsing as PVT_K1_ or WIF format
        this._privateKey = PrivateKey.from(prv);
      }
      this._publicKey = this._privateKey.toPublic();
    } catch (e) {
      throw new Error(`Invalid private key: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }

  /**
   * Record keys from a public key string
   *
   * @param pub - Public key in PUB_K1_ format or legacy EOS format
   */
  private recordKeysFromPublicKey(pub: string): void {
    try {
      this._publicKey = PublicKey.from(pub);
      this._privateKey = undefined;
    } catch (e) {
      throw new Error(`Invalid public key: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }

  /**
   * Get the keys in the default format used by BitGo
   *
   * @returns Object containing pub and optionally prv
   */
  getKeys(): DefaultKeys {
    return {
      pub: this._publicKey.toString(),
      prv: this._privateKey?.toString(),
    };
  }

  /**
   * Get the raw private key as a hex string (32 bytes / 64 hex chars)
   * Useful for signing operations
   *
   * @returns Raw private key hex string or undefined if not available
   */
  getRawPrivateKey(): string | undefined {
    if (!this._privateKey) {
      return undefined;
    }
    return Buffer.from(this._privateKey.data.array).toString('hex');
  }

  /**
   * Get the raw public key as a hex string (33 bytes compressed)
   *
   * @returns Raw public key hex string
   */
  getRawPublicKey(): string {
    return Buffer.from(this._publicKey.data.array).toString('hex');
  }

  /**
   * Get the address (for Proton, the address is not derived from the public key,
   * but is an account name registered on chain)
   * This returns the public key string as a placeholder.
   *
   * @param format - Optional address format
   * @returns Public key string
   */
  getAddress(format?: AddressFormat): string {
    return this._publicKey.toString();
  }

  /**
   * Get the underlying PrivateKey object
   *
   * @returns PrivateKey object or undefined
   */
  getPrivateKey(): PrivateKey | undefined {
    return this._privateKey;
  }

  /**
   * Get the underlying PublicKey object
   *
   * @returns PublicKey object
   */
  getPublicKey(): PublicKey {
    return this._publicKey;
  }

  /**
   * Sign a message digest (32-byte hash)
   *
   * @param digest - 32-byte hash to sign (as hex string or Buffer)
   * @returns Signature string in SIG_K1_ format
   */
  sign(digest: string | Buffer): string {
    if (!this._privateKey) {
      throw new Error('Cannot sign without a private key');
    }

    const digestBuffer = typeof digest === 'string' ? Buffer.from(digest, 'hex') : digest;

    if (digestBuffer.length !== 32) {
      throw new Error('Digest must be 32 bytes');
    }

    const signature = this._privateKey.signDigest(digestBuffer);
    return signature.toString();
  }

  /**
   * Verify a signature against a message digest
   *
   * @param signature - Signature in SIG_K1_ format
   * @param digest - 32-byte hash that was signed (as hex string or Buffer)
   * @returns true if signature is valid
   */
  verify(signature: string, digest: string | Buffer): boolean {
    const { Signature, Checksum256 } = require('@greymass/eosio');

    const digestBuffer = typeof digest === 'string' ? Buffer.from(digest, 'hex') : digest;

    if (digestBuffer.length !== 32) {
      throw new Error('Digest must be 32 bytes');
    }

    try {
      const sig = Signature.from(signature);
      const digestChecksum = Checksum256.from(digestBuffer);
      return sig.verifyDigest(digestChecksum, this._publicKey);
    } catch {
      return false;
    }
  }
}
