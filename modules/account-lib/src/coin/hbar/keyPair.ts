import { Ed25519PrivateKey, Ed25519PublicKey } from '@hashgraph/sdk';
import { Ed25519KeyPair } from '../baseCoin/ed25519KeyPair';
import { KeyPairOptions, ByteKeys } from '../baseCoin/iface';
import { NotSupported} from '../baseCoin/errors';

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
      pub: Uint8Array.from(Buffer.from(this.keyPair.pub, 'hex')),
    };

    if (this.keyPair.prv) {
      result.prv = Uint8Array.from(Buffer.from(this.keyPair.prv, 'hex'));
    }

    return result;
  }

  /** @inheritdoc */
  getAddress(format?: string): string {
    throw new NotSupported('Address derivation is not supported in Hedera');
  }

  /** @inheritdoc */
  recordKeysFromPublicKey(pub: string): void {
    const hederaPub = Buffer.from(Ed25519PublicKey.fromString(pub).toBytes()).toString('hex');
    this.keyPair = { pub: hederaPub };
  }

  /** @inheritdoc */
  recordKeysFromPrivateKey(prv: string): void {
    const hederaPrv = Buffer.from(Ed25519PrivateKey.fromString(prv).toBytes()).toString('hex');
    super.recordKeysFromPrivateKey(hederaPrv);
  }
}
