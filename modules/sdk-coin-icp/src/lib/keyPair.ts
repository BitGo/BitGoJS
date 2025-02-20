import {
  DefaultKeys,
  KeyPairOptions,
  Secp256k1ExtendedKeyPair,
  isSeed,
  isPrivateKey,
  isPublicKey,
} from '@bitgo/sdk-core';
import utils from './utils';
import { bip32 } from '@bitgo/utxo-lib';
import { randomBytes } from 'crypto';

const DEFAULT_SEED_SIZE_BYTES = 16;

/**
 * ICP keys and address management.
 */
export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key (extended or raw), or a public key
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

  /** @inheritdoc */
  getKeys(): DefaultKeys {
    return {
      pub: this.getPublicKey({ compressed: true }).toString('hex'),
      prv: this.getPrivateKey()?.toString('hex'),
    };
  }

  /** @inheritdoc */
  getAddress(): string {
    const principal = utils.derivePrincipalFromPublicKey(this.getKeys().pub);
    const subAccount = new Uint8Array(32);
    const accountId = utils.fromPrincipal(principal, subAccount);
    return accountId.toString();
  }
}
