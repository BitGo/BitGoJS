import * as crypto from 'crypto';
import { HDNode, ECPair } from 'bitgo-utxo-lib';
import blake2b from 'blake2b';
import { DefaultKeys, ExtendedKeys } from '../baseCoin/iface';
import * as CryptoUtils from '../../utils/crypto';
import * as Utils from './utils';
import { isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from './iface';

const DEFAULT_SEED_SIZE_BYTES = 16;

/**
 * Tezos keys and address management.
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
    if (CryptoUtils.isValidXprv(prv)) {
      this.hdNode = HDNode.fromBase58(prv);
    } else if (CryptoUtils.isValidPrv(prv)) {
      // Cannot create the HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPrivateKeyBuffer(new Buffer(prv, 'hex'));
    } else if (Utils.isValidKey(prv, Utils.hashTypes.spsk)) {
      this.keyPair = ECPair.fromPrivateKeyBuffer(Utils.decodeKey(prv, Utils.hashTypes.spsk));
    } else {
      throw new Error('Unsupported private key');
    }
  }

  /**
   * Build a Hierarchical Deterministic node or an ECPair from a public key.
   *
   * @param {string} pub - An extended, compressed, or uncompressed public key
   */
  private recordKeysFromPublicKey(pub: string): void {
    if (CryptoUtils.isValidXpub(pub)) {
      this.hdNode = HDNode.fromBase58(pub);
    } else if (CryptoUtils.isValidPub(pub)) {
      // Cannot create an HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPublicKeyBuffer(new Buffer(pub, 'hex'));
    } else if (Utils.isValidKey(pub, Utils.hashTypes.sppk)) {
      this.keyPair = ECPair.fromPublicKeyBuffer(Utils.decodeKey(pub, Utils.hashTypes.sppk));
    } else {
      throw new Error('Unsupported public key: ' + pub);
    }
  }

  /**
   * Return Tezos default keys with the respective prefixes
   *
   * @returns The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
    // Always use the compressed version to be consistent
    const pub = this.keyPair.Q.getEncoded(true);

    const result: DefaultKeys = {
      pub: Utils.base58encode(Utils.hashTypes.sppk.prefix, pub),
    };

    if (this.keyPair.d) {
      const prv = this.keyPair.getPrivateKeyBuffer();
      result.prv = Utils.base58encode(Utils.hashTypes.spsk.prefix, prv);
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
    const result: ExtendedKeys = {
      xpub: this.hdNode.neutered().toBase58(),
    };
    // A neutered HD node means it only contains the public key information
    if (!this.hdNode.isNeutered()) {
      result.xprv = this.hdNode.toBase58();
    }
    return result;
  }

  /**
   * Get a public address.
   */
  getAddress(): string {
    const pub = this.keyPair.Q.getEncoded(true);
    const out = Buffer.alloc(20);
    const b2b = blake2b(out.length)
      .update(pub)
      .digest(out);
    return Utils.base58encode(Utils.hashTypes.tz2.prefix, b2b);
  }
}
