import { bip32, BIP32Interface, ECPair, ECPairInterface } from '@bitgo/utxo-lib';
import * as Crypto from '../util/crypto';
import { KeyPairOptions, ExtendedKeys } from './iface';
import { BaseKeyPair } from './baseKeyPair';
import { AddressFormat } from './enum';
import { NotImplementedError } from './errors';

/**
 * Base class for SECP256K1 extended keypairs.
 */
export abstract class Secp256k1ExtendedKeyPair implements BaseKeyPair {
  static toKeyPair(hdNode: BIP32Interface): ECPairInterface {
    if (hdNode.privateKey) {
      return ECPair.fromPrivateKey(hdNode.privateKey);
    } else {
      return ECPair.fromPublicKey(hdNode.publicKey);
    }
  }

  // Implementation of the HD protocol (BIP32). Only available when creating a KeyPair from a seed,
  // or extended keys
  protected hdNode?: BIP32Interface;
  protected keyPair: ECPairInterface;
  protected source?: KeyPairOptions;
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param {KeyPairOptions} source Either a master seed, a private key (extended or raw), or a public key
   *     (extended, compressed, or uncompressed)
   */
  protected constructor(source?: KeyPairOptions) {
    this.source = source;
  }

  /**
   * @param compressed
   * @return Buffer 33 bytes if `compressed` is set, 65 bytes otherwise. Standard libsecp256k1 format.
   */
  getPublicKey({ compressed }: { compressed: boolean }): Buffer {
    return ECPair.fromPublicKey(this.keyPair?.publicKey, { compressed }).publicKey;
  }

  /**
   * @return Buffer 32 bytes in standard libsecp256k1 format
   */
  getPrivateKey(): Buffer | undefined {
    return this.keyPair?.privateKey;
  }

  /**
   * Build a Hierarchical Deterministic node or an ECPair from a private key.
   *
   * @param {string} prv An extended or raw private key
   */
  recordKeysFromPrivateKey(prv: string): void {
    if (Crypto.isValidXprv(prv)) {
      this.hdNode = bip32.fromBase58(prv);
    } else if (Crypto.isValidPrv(prv)) {
      // Cannot create the HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPrivateKey(Buffer.from(prv, 'hex'));
    } else {
      throw new Error('Unsupported private key');
    }
  }

  /**
   * Build a Hierarchical Deterministic node or an ECPair from a public key.
   *
   * @param {string} pub - An extended, compressed, or uncompressed public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (Crypto.isValidXpub(pub)) {
      this.hdNode = bip32.fromBase58(pub);
    } else if (Crypto.isValidPub(pub)) {
      // Cannot create an HD node without the chain code, so create a regular Key Chain
      this.keyPair = ECPair.fromPublicKey(Buffer.from(pub, 'hex'));
    } else {
      throw new Error('Unsupported public key: ' + pub);
    }
  }

  /**
   * Get the extended public key, and the private key if one is available. This is only possible
   * when the key pair was created from a seed or extended keys.
   *
   * @returns {ExtendedKeys} The Extended keys object
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

  getAddress(format?: AddressFormat): string {
    throw new NotImplementedError('getAddress not implemented');
  }

  getKeys(): any {
    throw new NotImplementedError('getKeys not implemented');
  }
}
