import { Ed25519PrivateKey, Ed25519PublicKey } from '@hashgraph/sdk';
import { Ed25519KeyPair } from '../baseCoin/ed25519KeyPair';
import { KeyPairOptions, DefaultKeys } from '../baseCoin/iface';
import { InvalidKey, NotSupported } from '../baseCoin/errors';

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
   * @returns { DefaultKeys } The keys in the protocol default format
   */
  getKeys(): DefaultKeys {
    const result: DefaultKeys = {
      pub: Ed25519PublicKey.fromString(this.keyPair.pub).toString(),
    };

    if (this.keyPair.prv) {
      result.prv = Ed25519PrivateKey.fromString(this.keyPair.prv).toString();
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
      const ed25519Pub = hederaPub.slice(24);
      return { pub: ed25519Pub };
    } catch (e) {
      throw new InvalidKey('Invalid public key: ' + pub);
    }
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    try {
      const hederaPrv = Ed25519PrivateKey.fromString(prv);
      const ed25519Prv = hederaPrv.toString().slice(32);
      const ed25519Pub = hederaPrv.publicKey.toString().slice(24);
      return {
        prv: ed25519Prv,
        pub: ed25519Pub,
      };
    } catch (e) {
      throw new InvalidKey('Invalid private key');
    }
  }
}
