import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { KeyPairOptions } from '../baseCoin/iface';

// XRP CODE
export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }
}