import { HDNode } from '@bitgo/utxo-lib';
import { addHexPrefix, pubToAddress } from 'ethereumjs-util';
import { DefaultKeys, isPrivateKey, isPublicKey, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';

/**
 * Ethereum keys and address management.
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
    if (source) {
      if (isPrivateKey(source)) {
        super.recordKeysFromPrivateKey(source.prv);
      } else if (isPublicKey(source)) {
        super.recordKeysFromPublicKey(source.pub);
      } else {
        throw new Error('Invalid key pair options');
      }
    } else {
      throw new Error('Invalid key pair options');
    }
  }

  /**
   * Ethereum default keys format is raw private and uncompressed public key
   *
   * @returns { DefaultKeys } The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
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
        pub: this.keyPair.Q.getEncoded(false)
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

  /**
   * Get an Ethereum public address
   *
   * @returns {string} The address derived from the public key
   */
  getAddress(): string {
    const publicKey = Buffer.from(this.getKeys().pub, 'hex'); // first two characters identify a public key
    return addHexPrefix(pubToAddress(publicKey, true).toString('hex'));
  }
}
