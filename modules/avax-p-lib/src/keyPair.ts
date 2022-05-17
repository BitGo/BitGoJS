import { randomBytes } from 'crypto';
import * as bip32 from 'bip32';
import { ECPair } from 'bitcoinjs-lib';
import { isValidXprv, isValidXpub } from '../../account-lib/src/utils/crypto';
import { KeyPairOptions, isPrivateKey, isPublicKey, isSeed, DefaultKeys } from '../../account-lib/src/coin/baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../../account-lib/src/coin/baseCoin/secp256k1ExtendedKeyPair';
const DEFAULT_SEED_SIZE_BYTES = 16;
import { Buffer as BufferAvax } from 'avalanche';
import { SECP256k1KeyPair } from 'avalanche/dist/common';
import { isValidPrivateKey, isValidPublicKey } from './utils';
import { Serialization } from 'avalanche/dist/utils';
import { chainID, hrp, serializedType } from './constants';

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
   * Get an Avalanche P-Chain public address
   *
   * @returns {string} The address derived from the public key
   */
  getAddress(): string {
    const publicKey = BufferAvax.from(this.getKeys().pub, 'hex');
    const addrressBuffer: BufferAvax = SECP256k1KeyPair.addressFromPublicKey(publicKey);
    const serialization: Serialization = Serialization.getInstance();
    return serialization.bufferToType(addrressBuffer, serializedType, hrp, chainID);
  }
}
