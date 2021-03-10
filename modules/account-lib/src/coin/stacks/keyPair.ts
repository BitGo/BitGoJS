import { randomBytes } from 'crypto';
import { ECPair, HDNode } from '@bitgo/utxo-lib';
import { getAddressFromPublicKey } from '@stacks/transactions';
import { DefaultKeys, isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { isValidPrivateKey, isValidPublicKey } from './utils';

const DEFAULT_SEED_SIZE_BYTES = 64;

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
      this.hdNode = HDNode.fromSeedBuffer(seed);
    } else if (isSeed(source)) {
      this.hdNode = HDNode.fromSeedBuffer(source.seed);
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }

    if (this.hdNode) {
      this.keyPair = this.hdNode.keyPair;
    }
  }

  /**
   * Build an ECPair from a private key.
   *
   * The private key is either 32 or 33 bytes long (64 or 66 characters hex).
   * If it is 32 bytes long, set the keypair's "compressed" field to false.
   * A 33 byte key has 0x01 as the last byte.
   *
   * @param {string} prv A raw private key
   */
  recordKeysFromPrivateKey(prv: string): void {
    if (!isValidPrivateKey(prv)) {
      throw new Error('Unsupported private key');
    }

    const compressed = prv.length === 66;
    this.keyPair = ECPair.fromPrivateKeyBuffer(Buffer.from(prv.slice(0, 64), 'hex'));
    this.keyPair.compressed = compressed;
  }

  /**
   * Build an ECPair from a public key.
   *
   * The public key is either 32 bytes or 64 bytes long, with a one-byte prefix
   * (a total of 66 or 130 characters in hex).  If the prefix is 0x02 or 0x03, it is a
   * compressed public key.  A prefix of 0x04 denotes an uncompressed public key.
   *
   * @param {string} pub A raw public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (!isValidPublicKey(pub)) {
      throw new Error('Unsupported public key');
    }

    this.keyPair = ECPair.fromPublicKeyBuffer(Buffer.from(pub, 'hex'));
  }

  /**
   * Stacks default keys format is raw private and uncompressed public key
   *
   * @param {boolean} compressed - Compress public key (defaults to false)
   * @returns {DefaultKeys} The keys in the protocol default key format
   */
  getKeys(compressed = false): DefaultKeys {
    return {
      pub: this.keyPair.Q.getEncoded(compressed).toString('hex'),
      prv: this.keyPair.d ? this.keyPair.d.toBuffer(32).toString('hex') : undefined,
    };
  }

  /**
   * Get a public address of an uncompressed public key.
   *
   * @returns {string} The public address
   */
  getAddress(): string {
    return getAddressFromPublicKey(this.getKeys(false).pub);
  }
}
