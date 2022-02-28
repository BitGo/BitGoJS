import { bip32 } from '@bitgo/utxo-lib';
import { randomBytes } from 'crypto';
import {
  AddressFormat,
  DefaultKeys,
  isPrivateKey,
  isPublicKey,
  isSeed,
  KeyPairOptions,
  Secp256k1ExtendedKeyPair,
} from '@bitgo/sdk-core';
import * as Utils from './utils';

const DEFAULT_SEED_SIZE_BYTES = 16;

/**
 * Tron keys and address management.
 */
export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param {KeyPairOptions} source Either a master seed, a private key (extended or raw), or a public key
   *     (extended, compressed, or uncompressed)
   */
  constructor(source?: KeyPairOptions) {
    super(source);
    if (!source) {
      const seed = randomBytes(DEFAULT_SEED_SIZE_BYTES);
      this.hdNode = bip32.fromSeed(seed);
    } else if (isSeed(source)) {
      this.hdNode = bip32.fromSeed(source.seed);
    } else if (isPrivateKey(source)) {
      super.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      super.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }

    if (this.hdNode) {
      this.keyPair = Secp256k1ExtendedKeyPair.toKeyPair(this.hdNode);
    }
  }

  /**
   * Tron default keys format is raw private and uncompressed public key
   *
   * @returns {DefaultKeys} The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
    return {
      pub: this.getPublicKey({ compressed: false }).toString('hex').toUpperCase(),
      prv: this.getPrivateKey()?.toString('hex').toUpperCase(),
    };
  }

  /**
   * Get a public address in the specified format, or in base58 if none is provided.
   *
   * @param {AddressFormat} format The address specified format
   * @returns {string} The public address in the specified format
   */
  getAddress(format?: AddressFormat): string {
    const { pub } = this.getKeys();
    // These are custom Tron methods. They can probably be replaced with other methods or libraries
    const addressBytes = Utils.getRawAddressFromPubKey(Buffer.from(pub, 'hex'));

    if (!format || format === AddressFormat.base58) {
      // Default address are in hex
      return Utils.getBase58AddressFromByteArray(addressBytes);
    } else if (format === AddressFormat.hex) {
      return Utils.getHexAddressFromByteArray(addressBytes);
    }
    throw new Error('Unsupported address format');
  }

  /**
   * Generates a signature for an arbitrary string with the current private key using keccak256
   * hashing algorithm. Throws if there is no private key.
   *
   * @param {string} message to produce a signature for
   * @returns {Buffer} The signature as a buffer
   */
  signMessage(message: string): Buffer {
    const messageToSign = Buffer.from(message).toString('hex');
    const { prv } = this.getKeys();
    if (!prv) {
      throw new Error('Missing private key');
    }
    const signature = Utils.signString(messageToSign, prv, true).replace(/^0x/, '');
    return Buffer.from(signature, 'hex');
  }

  /**
   * Verifies a message signature using the current public key.
   *
   * @param {string} message signed
   * @param {Buffer} signature to verify
   * @returns {boolean} True if the message was signed with the current key pair
   */
  verifySignature(message: string, signature: Buffer): boolean {
    const messageToVerify = Buffer.from(message).toString('hex');
    const address = this.getAddress(AddressFormat.base58);
    return Utils.verifySignature(messageToVerify, address, signature.toString('hex'), true);
  }
}
