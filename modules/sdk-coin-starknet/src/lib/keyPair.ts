import {
  DefaultKeys,
  KeyPairOptions,
  Secp256k1ExtendedKeyPair,
  isSeed,
  isPrivateKey,
  isPublicKey,
} from '@bitgo/sdk-core';
import utils from './utils';
import { bip32 } from '@bitgo/secp256k1';
import { randomBytes } from 'crypto';
import { DEFAULT_SEED_SIZE_BYTES } from './constants';

export class KeyPair extends Secp256k1ExtendedKeyPair {
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
    return utils.getAddressFromPublicKey(this.getKeys().pub);
  }
}
