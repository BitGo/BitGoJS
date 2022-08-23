import { randomBytes } from 'crypto';
import { bip32, ECPair } from '@bitgo/utxo-lib';
import { getAddressFromPublicKey, TransactionVersion } from '@stacks/transactions';
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
import { isValidPrivateKey, isValidPublicKey } from './utils';
import { DEFAULT_SEED_SIZE_BYTES } from './constants';

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
   * The protocol private key is either 32 or 33 bytes long (64 or 66
   * characters hex).  If it is 32 bytes long, set the keypair's "compressed"
   * field to false to later generate uncompressed public keys (the default).
   * A 33 byte key has 0x01 as the last byte.
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
   * Build an ECPair from a protocol public key or extended public key.
   *
   * The protocol public key is either 32 bytes or 64 bytes long, with a
   * one-byte prefix (a total of 66 or 130 characters in hex).  If the
   * prefix is 0x02 or 0x03, it is a compressed public key.  A prefix of 0x04
   * denotes an uncompressed public key.
   *
   * @param {string} pub A raw public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (!isValidPublicKey(pub)) {
      throw new Error('Unsupported public key');
    }

    if (isValidXpub(pub)) {
      this.hdNode = bip32.fromBase58(pub);
    } else {
      this.keyPair = ECPair.fromPublicKey(Buffer.from(pub, 'hex'));
    }
  }

  /**
   * Stacks default keys format is raw private and uncompressed public key
   *
   * @param {boolean} compressed - Compress public key (defaults to false)
   * @returns {DefaultKeys} The keys in the protocol default key format
   */
  getKeys(compressed = false): DefaultKeys {
    let prv = this.getPrivateKey()?.toString('hex');
    if (prv && compressed) {
      prv += '01';
    }

    return {
      pub: this.getPublicKey({ compressed }).toString('hex'),
      prv,
    };
  }

  getCompressed(): boolean {
    return this.keyPair.compressed;
  }

  /**
   * Get a public address of an uncompressed public key.
   *
   * @returns {string} The public address
   */
  getAddress(): string {
    return this.getSTXAddress(false, TransactionVersion.Mainnet);
  }

  /**
   * Get a public address of an uncompressed public key.
   *
   * @param {boolean} compressed - Compress public key (defaults to false)
   * @param {TransactionVersion} network - select Mainnet or Testnet for the address
   * @returns {string} The public address
   */
  getSTXAddress(compressed = false, network: TransactionVersion = TransactionVersion.Mainnet): string {
    return getAddressFromPublicKey(this.getKeys(compressed).pub, network);
  }
}
