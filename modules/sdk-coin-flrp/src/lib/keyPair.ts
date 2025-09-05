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
import createHash from 'create-hash';
import { Buffer as SafeBuffer } from 'safe-buffer';
import { bip32, ECPair } from '@bitgo/secp256k1';
import { randomBytes } from 'crypto';
import utils from './utils';

const DEFAULT_SEED_SIZE_BYTES = 16;
export enum addressFormat {
  testnet = 'fuji',
  mainnet = 'flr',
}

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
    try {
      if (isValidXpub(pub)) {
        this.hdNode = bip32.fromBase58(pub);
      } else {
        this.keyPair = ECPair.fromPublicKey(Buffer.from(pub, 'hex'));
      }
      return;
    } catch (e) {
      try {
        this.keyPair = ECPair.fromPublicKey(Buffer.from(utils.cb58Decode(pub)));
        return;
      } catch (e) {
        throw new Error('Unsupported public key');
      }
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
   * Get a Flare P-Chain public mainnet address
   *
   * @param {string} format - flare hrp selector: Mainnet(flr) or Testnet(fuji)
   * @returns {string} The mainnet address derived from the public key
   */
  getAddress(format = 'mainnet'): string {
    return this.getFlrPAddress(addressFormat[format]);
  }
  /**
   * Get a public address of public key.
   *
   * @param {string} hrp - select Mainnet(flr) or Testnet(fuji) for the address
   * @returns {string} The address derived from the public key and hrp
   */
  getFlrPAddress(hrp: string): string {
    const addressBuffer = Buffer.from(this.getAddressBuffer());
    return utils.addressToString(hrp, 'P', addressBuffer);
  }

  /**
   * Get a Flare P-Chain public mainnet address buffer
   *
   * @returns {Buffer} The address buffer derived from the public key
   */
  private getAddressBuffer(): Buffer {
    try {
      // Use the safe buffer method for address derivation
      return this.getAddressSafeBuffer();
    } catch (error) {
      return this.getAddressSafeBuffer();
    }
  }

  /**
   * Use the safe Buffer instead of the regular buffer to derive the address buffer. Used in the OVC.
   *
   * @returns {Buffer}
   */
  private getAddressSafeBuffer(): Buffer {
    const publicKeySafe = SafeBuffer.from(this.keyPair.publicKey.toString('hex'), 'hex');
    const sha256 = SafeBuffer.from(createHash('sha256').update(publicKeySafe).digest());
    return Buffer.from(createHash('ripemd160').update(sha256).digest());
  }
}
