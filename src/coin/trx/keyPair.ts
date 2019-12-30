import { DefaultKeys, ExtendedKeys} from '../baseCoin/iface';
import * as crypto from 'crypto';
import { HDNode, ECPair } from 'bitgo-utxo-lib';
import { AddressFormat } from '../baseCoin/enum';
import * as Utils from './utils';
import { isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from './iface';
import * as Crypto from '../../utils/crypto';

const DEFAULT_SEED_SIZE_BYTES = 16;

/**
 * Tron keys and address management.
 */
export class KeyPair {
  // Implementation of the HD protocol (BIP32). Only available when creating a KeyPair from a seed,
  // or extended keys
  private hdNode?: HDNode;
  private keyPair: ECPair;

  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param source Either a master seed, a private key (extended or raw), or a public key
   *     (extended, compressed, or uncompressed)
   */
  constructor(source?: KeyPairOptions) {
    if (!source) {
      const seed = crypto.randomBytes(DEFAULT_SEED_SIZE_BYTES);
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
   * Build a Hierarchical Deterministic node or an ECPair from a private key.
   *
   * @param prv An extended or raw private key
   */
  private recordKeysFromPrivateKey(prv: string): void {
    if (Crypto.isValidXprv(prv)) {
      this.hdNode = HDNode.fromBase58(prv);
    } else if (Crypto.isValidPrv(prv)) {
      // Cannot create the HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPrivateKeyBuffer(new Buffer(prv, 'hex'));
    } else {
      throw new Error('Unsupported private key');
    }
  }

  /**
   * Build a Hierarchical Deterministic node or an ECPair from a public key.
   *
   * @param {String} pub - An extended, compressed, or uncompressed public key
   */
  private recordKeysFromPublicKey(pub: string): void {
    if (Crypto.isValidXpub(pub)) {
      this.hdNode = HDNode.fromBase58(pub);
    } else if (Crypto.isValidPub(pub)) {
      // Cannot create an HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPublicKeyBuffer(new Buffer(pub, 'hex'));
    } else {
      throw new Error('Unsupported public key: ' + pub );
    }
  }

  /**
   * Tron default keys format is raw private and uncompressed public key
   * @return The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
    const result: DefaultKeys = {
      pub: this.keyPair.Q.getEncoded(false).toString('hex').toUpperCase(),
    };

    if (this.keyPair.d) {
      result.prv = this.keyPair.d.toBuffer(32).toString('hex').toUpperCase();
    }
    return result;
  }

  /**
   * Get the extended public key, and the private key if one is available. This is only possible
   * when the key pair was created from a seed or extended keys.
   */
  getExtendedKeys(): ExtendedKeys {
    if (!this.hdNode) {
      throw new Error('Cannot get extended keys');
    }
    let result: ExtendedKeys = {
      xpub: this.hdNode.neutered().toBase58(),
    };
    // A neutered HD node means it only contains the public key information
    if (!this.hdNode.isNeutered()) {
      result.xprv = this.hdNode.toBase58();
    }
    return result;
  }

  /**
   * Get a public address in the specified format, or in base58 if none is provided.
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
   * @param {string} message to produce a signature for
   * @return The signature as a buffer
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
   * @param {string} message signed
   * @param {Buffer} signature to verify
   * @return True if the message was signed with the current key pair
   */
  verifySignature(message: string, signature: Buffer): boolean {
    const messageToVerify = Buffer.from(message).toString('hex');
    const address = this.getAddress(AddressFormat.base58);
    return Utils.verifySignature(messageToVerify, address, signature.toString('hex'), true);
  }
}
