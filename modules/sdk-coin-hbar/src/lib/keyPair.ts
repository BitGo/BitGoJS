import { PrivateKey, PublicKey } from '@hashgraph/sdk';
import { AddressFormat, DefaultKeys, Ed25519KeyPair, InvalidKey, KeyPairOptions, NotSupported } from '@bitgo/sdk-core';
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
    const pub = PublicKey.fromString(this.keyPair.pub).toString();
    const result: DefaultKeys = {
      pub: raw ? pub.slice(PUBLIC_KEY_PREFIX.length) : pub,
    };

    if (this.keyPair.prv) {
      const prv = PrivateKey.fromString(this.keyPair.prv).toString();
      result.prv = raw ? prv.slice(PRIVATE_KEY_PREFIX.length) : prv;
    }
    return result;
  }

  /** @inheritdoc */
  getAddress(format?: AddressFormat): string {
    throw new NotSupported('Address derivation is not supported in Hedera');
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    try {
      const hederaPub = PublicKey.fromString(pub.toLowerCase()).toString();
      const ed25519Pub = removePrefix(PUBLIC_KEY_PREFIX, hederaPub);
      return { pub: ed25519Pub };
    } catch (e) {
      throw new InvalidKey('Invalid public key: ' + pub);
    }
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    if (!/^([a-f\d]{2})+$/i.test(prv)) {
      throw new InvalidKey('Invalid private key length. Must be a hex and multiple of 2');
    }
    try {
      const hederaPrv = PrivateKey.fromString(prv);
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
