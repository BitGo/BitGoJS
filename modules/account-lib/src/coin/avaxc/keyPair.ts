import { KeyPairOptions, DefaultKeys, isPrivateKey, isPublicKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';

export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
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
   * Avalanche default keys format is CB58 strings with prefixes
   *
   * @returns { DefaultKeys } The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
    throw new NotImplementedError('getKeys not implemented');
  }

  /**
   * Avalanche C-chain address is an Eth-like hex value starting with 0x prefix
   */
  getAddress(): string {
    throw new NotImplementedError('getAddress not implemented');
  }
}
