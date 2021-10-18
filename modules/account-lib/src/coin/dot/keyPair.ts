import { Keyring } from '@polkadot/keyring';
import { createPair } from '@polkadot/keyring/pair';
import { KeyringPair } from '@polkadot/keyring/types';
import { Ed25519KeyPair } from '../baseCoin';
import { AddressFormat } from '../baseCoin/enum';
import { DefaultKeys, KeyPairOptions } from '../baseCoin/iface';
import utils from './utils';

const TYPE = 'ed25519';
const keyring = new Keyring({ type: TYPE });

export class KeyPair extends Ed25519KeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */

  polkadotKeyPair: KeyringPair;

  constructor(source?: KeyPairOptions) {
    super(source);
  }

  protected createPolkadotPair(): KeyringPair {
    const secretKey = this.keyPair.prv ? new Uint8Array(Buffer.from(this.keyPair.prv, 'hex')) : new Uint8Array();
    const publicKey = new Uint8Array(Buffer.from(this.keyPair.pub, 'hex'));
    return createPair({ toSS58: keyring.encodeAddress, type: TYPE }, { secretKey, publicKey });
  }

  getAddress(format?: AddressFormat): string {
    return this.createPolkadotPair().address;
  }

  getSigningKeyPair(): KeyringPair {
    return this.createPolkadotPair();
  }

  getKeys(): DefaultKeys {
    const result: DefaultKeys = { pub: this.keyPair.pub };

    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }

    return result;
  }

  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    const decodedSeed = utils.decodeSeed(prv);
    const bufferFromSeed = Buffer.from(decodedSeed.seed);
    return utils.keyPairFromSeed(bufferFromSeed).keyPair;
  }

  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const publicKey = keyring.addFromPair({
      publicKey: new Uint8Array(Buffer.from(pub, 'hex')),
      secretKey: new Uint8Array(),
    }).publicKey;
    return { pub: utils.toHex(publicKey) };
  }
}
