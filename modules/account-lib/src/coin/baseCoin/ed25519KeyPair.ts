import * as nacl from 'tweetnacl';
import * as hex from '@stablelib/hex';
import { BaseKeyPair } from './baseKeyPair';
import { AddressFormat } from './enum';
import { isPrivateKey, isPublicKey, isSeed, DefaultKeys, KeyPairOptions } from './iface';
import { NotImplementedError } from './errors';

const DEFAULT_SEED_SIZE_BYTES = 32;

export abstract class Ed25519KeyPair implements BaseKeyPair {
  protected keyPair: DefaultKeys;
  protected source?: KeyPairOptions;

  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param {KeyPairOptions} source Either a master seed, a private key, or a public key
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
    this.keyPair = {
      prv: hex.encode(naclKeyPair.secretKey).slice(0, 64),
      pub: hex.encode(naclKeyPair.publicKey),
    };
  }

  recordKeysFromPrivateKey(prv: string): void {
    const decodedPrv = hex.decode(prv);
    // fromSeed takes the private key bytes and calculates the public key
    const naclKeyPair = nacl.sign.keyPair.fromSeed(decodedPrv);
    this.setKeyPair(naclKeyPair);
  }

  recordKeysFromPublicKey(pub: string): void {
    throw new NotImplementedError("recordKeysFromPublicKey not implemented since it's protocol dependent");
  }

  abstract getAddress(format?: AddressFormat): string;

  abstract getKeys(): any;
}
