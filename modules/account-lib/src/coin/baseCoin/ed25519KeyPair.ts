import * as nacl from 'tweetnacl';
import * as hex from '@stablelib/hex';
import * as stellar from 'stellar-sdk';
import { Seed, generateAccountFromSeed, generateAccount } from 'algosdk';
import { BaseKeyPair } from './baseKeyPair';
import { AddressFormat } from './enum';
import { NotImplementedError } from './errors';
import { isPrivateKey, isPublicKey, isSeed, DefaultKeys, KeyPairOptions, ByteKeys } from './iface';

const DEFAULT_SEED_SIZE_BYTES = 32;

export abstract class Ed25519KeyPair implements BaseKeyPair {
  protected keyPair: ByteKeys;
  protected source?: KeyPairOptions;

  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param {KeyPairOptions} source Either a master seed, a private key (extended or raw), or a public key
   */
  protected constructor(source?: KeyPairOptions) {
    let naclKeyPair;
    if (!source) {
      const seed = nacl.randomBytes(DEFAULT_SEED_SIZE_BYTES);
      naclKeyPair = nacl.sign.keyPair.fromSeed(seed);
      this.setKeyPair(naclKeyPair);
    } else if (isSeed(source)) {
      naclKeyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(source.seed));
      this.setKeyPair(naclKeyPair);
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }
  }

  private setKeyPair(naclKeyPair: nacl.SignKeyPair): void {
    this.keyPair = { prv: naclKeyPair.secretKey, pub: naclKeyPair.publicKey };
  }

  getAddress(format?: AddressFormat): string {
    throw new NotImplementedError('It is not possible to derive an address from an ed25519 keypair');
  }

  getKeys(): ByteKeys {
    const result: ByteKeys = {
      pub: this.keyPair.pub,
    };

    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }

    return result;
  }

  recordKeysFromPrivateKey(prv: string): void {
    const decodedPrv = hex.decode(prv);
    const naclKeyPair = nacl.sign.keyPair.fromSecretKey(decodedPrv);
    this.setKeyPair(naclKeyPair);
  }

  recordKeysFromPublicKey(pub: string): void {
    const decodedPub = hex.decode(pub);
    this.keyPair = { pub: decodedPub };
  }

  // Region Stellar
  // TODO: implement from stellar seed, etc.
  /**
   * Generate ed25519 key pair
   *
   * @param {Buffer} seed a buffer seed to generate a new account
   * @returns {object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): DefaultKeys {
    const pair = seed ? generateAccountFromSeed(seed) : generateAccount();
    return {
      pub: pair.addr, // encoded pub
      prv: Seed.encode(pair.sk), // encoded seed
    };
  }

  isStellarSeed(seed: string): boolean {
    return stellar.StrKey.isValidEd25519SecretSeed(seed);
  }

  convertFromStellarSeed(seed: string): string | null {
    // assume this is a trust custodial seed if its a valid ed25519 prv
    if (!this.isStellarSeed(seed)) {
      return null;
    }
    return Seed.encode(stellar.StrKey.decodeEd25519SecretSeed(seed));
  }
  // endregion
}
