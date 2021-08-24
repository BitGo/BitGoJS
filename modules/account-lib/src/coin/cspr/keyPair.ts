import { randomBytes } from 'crypto';
import { HDNode } from '@bitgo/utxo-lib';
import { KeyPairOptions, isPrivateKey, isPublicKey, isSeed } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { SECP256K1_PREFIX } from './constants';
const DEFAULT_SEED_SIZE_BYTES = 16;

export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
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
   * Default keys format is a pair of Uint8Array keys
   *
   * @returns { DefaultKeys } The keys in the defined format
   */
  getKeys() {
    if (this.hdNode) {
      const { xpub, xprv } = this.getExtendedKeys();
      return {
        pub: HDNode.fromBase58(xpub).getPublicKeyBuffer().toString('hex'),
        prv: xprv ? HDNode.fromBase58(xprv).keyPair.getPrivateKeyBuffer().toString('hex') : undefined,
      };
    } else {
      return {
        pub: this.keyPair.Q.getEncoded(true).toString('hex'),
        prv: this.keyPair.d ? this.keyPair.d.toBuffer(32).toString('hex') : undefined,
      };
    }
  }

  /** @inheritdoc */
  getAddress(): string {
    const keys = this.getKeys();
    return SECP256K1_PREFIX + keys.pub;
  }
}
