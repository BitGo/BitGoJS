import * as crypto from 'crypto';
import { DefaultKeys, ExtendedKeys } from '../baseCoin/iface';
import * as Crypto from '../../utils/crypto';
import { AddressFormat } from '../baseCoin/enum';
import { isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from './iface';
import { HDNode, ECPair } from 'bitgo-utxo-lib';
import keccak256 from 'keccak256';

const DEFAULT_SEED_SIZE_BYTES = 16;

/**
 * Ethereum keys and address management.
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
    if (source) {
      if (isPrivateKey(source)) {
        this.recordKeysFromPrivateKey(source.prv);
      } else if (isPublicKey(source)) {
        this.recordKeysFromPublicKey(source.pub);
      } else {
        throw new Error('Invalid key pair options');
      }
    } else {
      throw new Error('Invalid key pair options');
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
   * @param {string} pub - An extended, compressed, or uncompressed public key
   */
  private recordKeysFromPublicKey(pub: string): void {
    if (Crypto.isValidXpub(pub)) {
      this.hdNode = HDNode.fromBase58(pub);
    } else if (Crypto.isValidPub(pub)) {
      // Cannot create an HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPublicKeyBuffer(new Buffer(pub, 'hex'));
    } else {
      throw new Error('Unsupported public key: ' + pub);
    }
  }

  /**
   * Ethereum default keys format is raw private and uncompressed public key
   *
   * @returns The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
    const result: DefaultKeys = {
      pub: this.keyPair.Q.getEncoded(false)
        .toString('hex')
        .toUpperCase(),
    };

    if (this.keyPair.d) {
      result.prv = this.keyPair.d
        .toBuffer(32)
        .toString('hex')
        .toUpperCase();
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
   * Get a public address
   *
   * @returns {string} The address derived from the private key
   */
  getAddress(): string {
    const EC = require('elliptic').ec;
    const ec = new EC('secp256k1');

    const privateKey = this.getKeys().prv;

    const G = ec.g; // Generator point
    const pubPoint = G.mul(privateKey); // EC multiplication to determine public point
    const x = pubPoint.getX().toBuffer(); //32 bit x co-ordinate of public point
    const y = pubPoint.getY().toBuffer(); //32 bit y co-ordinate of public point

    const publicKey = Buffer.concat([x, y]);
    const address = keccak256(publicKey); // keccak256 hash of  publicKey
    const buf2 = Buffer.from(address, 'hex');
    const ethAddress = '0x' + buf2.slice(-20).toString('hex');
    return ethAddress;
  }
}
