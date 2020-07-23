import * as hex from '@stablelib/hex';
import { Ed25519PrivateKey, Ed25519PublicKey } from '@hashgraph/sdk';
import { Ed25519KeyPair } from '../baseCoin/ed25519KeyPair';
import { KeyPairOptions, ByteKeys } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';

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
   * @returns { ByteKeys } The keys in the protocol default key format
   */
  getKeys(): ByteKeys {
    const result: ByteKeys = {
      pub: hex.decode(this.keyPair.pub),
    };

    if (this.keyPair.prv) {
      result.prv = hex.decode(this.keyPair.prv);
    }

    return result;
  }

  /** @inheritdoc */
  getAddress(format?: string): string {
    throw new NotImplementedError("It's not possible to derive Hedera addresses from a keypair.");
  }

  /** @inheritdoc */
  recordKeysFromPublicKey(pub: string): void {
    const hederaPub = Ed25519PublicKey.fromString(pub).toString(true);
    this.keyPair = { pub: hederaPub };
  }

  /** @inheritdoc */
  recordKeysFromPrivateKey(prv: string): void {
    const hederaPrv = Ed25519PrivateKey.fromString(prv).toString(true);
    super.recordKeysFromPrivateKey(hederaPrv);
  }
}
