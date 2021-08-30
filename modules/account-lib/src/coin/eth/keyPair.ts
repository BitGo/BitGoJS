import { addHexPrefix, pubToAddress } from 'ethereumjs-util';
import { DefaultKeys, isPrivateKey, isPublicKey, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';

/**
 * Ethereum keys and address management.
 */
export class KeyPair extends Secp256k1ExtendedKeyPair {
  // We only compress when initialized from an extended key
  private compressed?: boolean = false;

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

    if (this.hdNode) {
      this.keyPair = Secp256k1ExtendedKeyPair.toKeyPair(this.hdNode);
      this.compressed = true;
    }
  }

  /**
   * Ethereum default keys format is raw private and uncompressed public key
   *
   * @returns { DefaultKeys } The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
    return {
      pub: this.getPublicKey({ compressed: this.compressed ?? false })
        .toString('hex')
        .toUpperCase(),
      prv: this.getPrivateKey()?.toString('hex').toUpperCase(),
    };
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
