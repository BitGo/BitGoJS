import { Ed25519PrivateKey, Ed25519PublicKey } from '@hashgraph/sdk';
import { Ed25519KeyPair } from '../baseCoin/ed25519KeyPair';
import { KeyPairOptions, DefaultKeys } from '../baseCoin/iface';
import { NotSupported } from '../baseCoin/errors';
import { toHex } from './utils';

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
      pub: this.keyPair.pub,
    };

    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }
    return result;
  }

  /** @inheritdoc */
  getAddress(format?: string): string {
    throw new NotSupported('Address derivation is not supported in Hedera');
  }

  /** @inheritdoc */
  recordKeysFromPublicKey(pub: string): void {
    const hederaPub = toHex(Ed25519PublicKey.fromString(pub).toBytes());
    this.keyPair = { pub: hederaPub };
  }

  /** @inheritdoc */
  recordKeysFromPrivateKey(prv: string): void {
    const hederaPrv = toHex(Ed25519PrivateKey.fromString(prv).toBytes());
    super.recordKeysFromPrivateKey(hederaPrv);
  }
}
