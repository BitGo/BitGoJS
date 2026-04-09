import { Keypair as SolKeypair } from '@solana/web3.js';
import { DefaultKeys, KeyPairOptions, Ed25519KeyPair } from '@bitgo/sdk-core';
import { SolanaKeys } from './iface';
import { base58ToUint8Array, Uint8ArrayTobase58 } from './utils';

export class KeyPair extends Ed25519KeyPair {
  protected keyPair: DefaultKeys;
  protected source?: KeyPairOptions;

  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    const prvKey = base58ToUint8Array(prv);
    const keyPair = SolKeypair.fromSecretKey(prvKey);

    return {
      pub: keyPair.publicKey.toBuffer().toString('hex'),
      prv: Buffer.from(keyPair.secretKey.slice(0, 32)).toString('hex'),
    };
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    return {
      pub: Buffer.from(base58ToUint8Array(pub)).toString('hex'),
    };
  }

  /**
   * Solana default keys format public key as a base58 string and secret key as Uint8Array
   *
   * @param {boolean} raw defines if the prv key is returned in Uint8Array, default is base58
   * @returns {SolanaKeys} The keys in the defined format
   */
  getKeys(raw = false): SolanaKeys {
    // keys are originally created in hex, but we need base58
    const publicKeyBuffer = Buffer.from(this.keyPair.pub, 'hex');
    const base58Pub = Uint8ArrayTobase58(publicKeyBuffer);

    const result: SolanaKeys = { pub: base58Pub };
    if (!!this.keyPair.prv) {
      const secretKeyBuffer = Buffer.from(this.keyPair.prv, 'hex');
      const solanaSecretKey = new Uint8Array(64);
      solanaSecretKey.set(secretKeyBuffer);
      solanaSecretKey.set(publicKeyBuffer, 32);

      if (raw) {
        result.prv = solanaSecretKey;
      } else {
        result.prv = Uint8ArrayTobase58(solanaSecretKey);
      }
    }
    return result;
  }

  /** @inheritdoc */
  getAddress(): string {
    const keys = this.getKeys();
    return keys.pub;
  }
}
