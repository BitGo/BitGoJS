import { Ed25519PrivateKey, Ed25519PublicKey } from '@hashgraph/sdk';
import { Ed25519KeyPair } from '../baseCoin/ed25519KeyPair';
import { KeyPairOptions, DefaultKeys } from '../baseCoin/iface';
import { InvalidKey, NotSupported , NotImplementedError} from '../baseCoin/errors';
// import { removePrefix } from './utils';


export class KeyPair extends Ed25519KeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /**
   * Default keys format is a pair of Uint8Array keys
   *
   * @param {boolean} raw defines if the key is returned in raw or protocol default format
   * @returns { DefaultKeys } The keys in the defined format
   */
  getKeys(raw = false) {
    throw new NotImplementedError("getKeys not implemented")
    
  }

  /** @inheritdoc */
  getAddress(format?: string): string {
    throw new NotImplementedError("getKeys not implemented")
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    throw new NotImplementedError("recordKeysFromPublicKeyInProtocolFormat not implemented")
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new NotImplementedError("recordKeysFromPrivateKeyInProtocolFormat not implemented")
  }
}
