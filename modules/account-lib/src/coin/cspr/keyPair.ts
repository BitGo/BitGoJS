import { randomBytes } from 'crypto';
import { HDNode } from '@bitgo/utxo-lib';
import { Keys } from 'casper-client-sdk';
import { KeyPairOptions, DefaultKeys, isPrivateKey, isPublicKey, isSeed } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';

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
        pub: HDNode.fromBase58(xpub)
          .getPublicKeyBuffer()
          .toString('hex')
          .toUpperCase(),
        prv: xprv
          ? HDNode.fromBase58(xprv)
              .keyPair.getPrivateKeyBuffer()
              .toString('hex')
              .toUpperCase()
          : undefined,
      };
    } else {
      return {
        pub: this.keyPair.Q.getEncoded(true)
          .toString('hex')
          .toUpperCase(),
        prv: this.keyPair.d
          ? this.keyPair.d
              .toBuffer(32)
              .toString('hex')
              .toUpperCase()
          : undefined,
      };
    }
  }

  /** @inheritdoc */
  getAddress(): string {
    const keys = this.getKeys();
    const publicKey = Buffer.from(keys.pub); // first two characters identify a public key
    const privateKey = keys.prv ? Buffer.from(keys.prv) : undefined;
    const accountHashByArray = new Keys.Secp256K1(publicKey, privateKey!).accountHash();
    return Buffer.from(accountHashByArray).toString('hex');
  }
}
