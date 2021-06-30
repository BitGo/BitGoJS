import { randomBytes } from 'crypto';
import { HDNode } from '@bitgo/utxo-lib';
import ecc from 'eosjs-ecc';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { DefaultKeys, isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from '../baseCoin/iface';
import { NotImplementedError, NotSupported } from '../baseCoin/errors';
import { isValidXprv, isValidXpub } from '../../utils/crypto';

export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
    if (!source) {
      this.hdNode = HDNode.fromSeedBuffer(randomBytes(512 / 8));
    } else if (isSeed(source)) {
      this.hdNode = HDNode.fromSeedBuffer(source.seed);
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new NotSupported('Keypair has an unsupported type');
    }
  }
  /**
   * Build a keypair from a protocol private key or extended private key.
   *
   * @param {string} prv Private key
   */
  recordKeysFromPrivateKey(prv: string): void {
    if (!isValidXprv(prv) && !ecc.isValidPrivate(prv)) {
      throw new Error('Unsupported private key');
    }
    if (isValidXprv(prv)) {
      this.hdNode = HDNode.fromBase58(prv);
    } else {
      this.keyPair = { pub: ecc.privateToPublic(prv), prv: prv };
    }
  }

  /**
   * Build a keypair from a protocol public key or extended public key.
   *
   * @param {string} pub Public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (!isValidXpub(pub) && !ecc.isValidPublic(pub)) {
      throw new Error('Unsupported public key');
    }
    if (isValidXpub(pub)) {
      this.hdNode = HDNode.fromBase58(pub);
    } else {
      this.keyPair = { pub: pub };
    }
  }

  /** @inheritdoc */
  getKeys(): DefaultKeys {
    if (this.hdNode) {
      const publicKey = ecc.PublicKey.fromBuffer(this.hdNode.neutered().getPublicKeyBuffer()).toString();
      const privateKey = this.hdNode.keyPair.toWIF();
      return { pub: publicKey, prv: privateKey };
    } else {
      const result: DefaultKeys = { pub: this.keyPair.pub };
      if (this.keyPair.prv) {
        result.prv = this.keyPair.prv;
      }
      return result;
    }
  }
  /** @inheritdoc */
  getAddress(): string {
    throw new NotImplementedError('getAddress not implemented');
  }
}
