import { randomBytes } from 'crypto';
import blake2b from 'blake2b';
import { HDNode, ECPair } from '@bitgo/utxo-lib';
import * as CryptoUtils from '../../utils/crypto';
import { DefaultKeys, isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import * as Utils from './utils';

const DEFAULT_SEED_SIZE_BYTES = 16;

/**
 * Tezos keys and address management.
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
   * Specific Tezos implementation
   *
   * @param {string} prv An extended or raw private key
   */
  recordKeysFromPrivateKey(prv: string): void {
    if (CryptoUtils.isValidXprv(prv)) {
      this.hdNode = HDNode.fromBase58(prv);
    } else if (CryptoUtils.isValidPrv(prv)) {
      // Cannot create the HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPrivateKeyBuffer(Buffer.from(prv, 'hex'));
    } else if (Utils.isValidKey(prv, Utils.hashTypes.spsk)) {
      this.keyPair = ECPair.fromPrivateKeyBuffer(Utils.decodeKey(prv, Utils.hashTypes.spsk));
    } else {
      throw new Error('Unsupported private key');
    }
  }

  /**
   * Build a Hierarchical Deterministic node or an ECPair from a public key.
   * Specific Tezos implementation
   *
   * @param {string} pub - An extended, compressed, or uncompressed public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (CryptoUtils.isValidXpub(pub)) {
      this.hdNode = HDNode.fromBase58(pub);
    } else if (CryptoUtils.isValidPub(pub)) {
      // Cannot create an HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPublicKeyBuffer(Buffer.from(pub, 'hex'));
    } else if (Utils.isValidKey(pub, Utils.hashTypes.sppk)) {
      this.keyPair = ECPair.fromPublicKeyBuffer(Utils.decodeKey(pub, Utils.hashTypes.sppk));
    } else {
      throw new Error('Unsupported public key: ' + pub);
    }
  }

  /**
   * Return Tezos default keys with the respective prefixes
   *
   * @returns {DefaultKeys} The keys in the protocol default key format
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
   * Get a public address.
   *
   * @returns {string} The public address
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
