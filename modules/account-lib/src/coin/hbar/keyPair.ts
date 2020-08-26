import { Ed25519PrivateKey, Ed25519PublicKey } from '@hashgraph/sdk';
import { Ed25519KeyPair } from '../baseCoin/ed25519KeyPair';
import { KeyPairOptions, DefaultKeys } from '../baseCoin/iface';
import { InvalidKey, NotSupported } from '../baseCoin/errors';
import { removePrefix } from './utils';

const PUBLIC_KEY_PREFIX = '302a300506032b6570032100';
const PRIVATE_KEY_PREFIX = '302e020100300506032b657004220420';

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
   * Hedera default keys format is a pair of Uint8Array keys
   *
   * @param {boolean} raw defines if the key is returned in raw or protocol default format
   * @returns { DefaultKeys } The keys in the defined format
   */
  getKeys(raw = false): DefaultKeys {
    const result: DefaultKeys = {
      pub: Ed25519PublicKey.fromString(this.keyPair.pub).toString(raw),
    };

    if (this.keyPair.prv) {
      result.prv = Ed25519PrivateKey.fromString(this.keyPair.prv).toString(raw);
    }
    return result;
  }

  /** @inheritdoc */
  getAddress(format?: string): string {
    throw new NotSupported('Address derivation is not supported in Hedera');
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    try {
      const hederaPub = Ed25519PublicKey.fromString(pub.toLowerCase()).toString();
      const ed25519Pub = removePrefix(PUBLIC_KEY_PREFIX, hederaPub);
      return { pub: ed25519Pub };
    } catch (e) {
      throw new InvalidKey('Invalid public key: ' + pub);
    }
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    try {
      const hederaPrv = Ed25519PrivateKey.fromString(prv);
      const ed25519Prv = removePrefix(PRIVATE_KEY_PREFIX, hederaPrv.toString());
      const ed25519Pub = removePrefix(PUBLIC_KEY_PREFIX, hederaPrv.publicKey.toString());
      return {
        prv: ed25519Prv,
        pub: ed25519Pub,
      };
    } catch (e) {
      throw new InvalidKey('Invalid private key');
    }
  }
}
