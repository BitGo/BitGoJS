import { Keyring } from '@polkadot/keyring';
import { createPair } from '@polkadot/keyring/pair';
import { KeyringPair } from '@polkadot/keyring/types';
import { DotAddressFormat, DefaultKeys, Ed25519KeyPair, isBase58, KeyPairOptions, toHex } from '@bitgo/sdk-core';
import bs58 from 'bs58';
import utils from './utils';

const TYPE = 'ed25519';
const keyring = new Keyring({ type: TYPE });

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
   * Helper function to create the KeyringPair for signing a dot transaction.
   *
   * @returns {KeyringPair} dot KeyringPair
   *
   * @see https://polkadot.js.org/docs/api/start/keyring
   */
  protected createPolkadotPair(): KeyringPair {
    const secretKey = this.keyPair.prv ? new Uint8Array(Buffer.from(this.keyPair.prv, 'hex')) : undefined;
    const publicKey = new Uint8Array(Buffer.from(this.keyPair.pub, 'hex'));
    return createPair({ toSS58: keyring.encodeAddress, type: TYPE }, { secretKey, publicKey });
  }

  /**
   // https://wiki.polkadot.network/docs/learn-accounts#address-format
   * Returns the address in either mainnet polkadot format (starts with 1)
   * or substrate format used for westend (starts with 5)
   */
  getAddress(format: DotAddressFormat): string {
    let encodedAddress = this.createPolkadotPair().address;
    encodedAddress = keyring.encodeAddress(encodedAddress, format as number);

    return encodedAddress;
  }

  /** @inheritdoc */
  getKeys(): DefaultKeys {
    const result: DefaultKeys = { pub: this.keyPair.pub };
    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }
    return result;
  }

  /** @inheritdoc */
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    const decodedSeed = utils.decodeSeed(prv);
    const bufferFromSeed = Buffer.from(decodedSeed.seed);
    return utils.keyPairFromSeed(bufferFromSeed).keyPair;
  }

  /** @inheritdoc */
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const publicKey = keyring.addFromPair({
      // tss common pub is in base58 format and decodes to length of 32
      publicKey: isBase58(pub, 32) ? new Uint8Array(bs58.decode(pub)) : new Uint8Array(Buffer.from(pub, 'hex')),
      secretKey: new Uint8Array(),
    }).publicKey;
    return { pub: toHex(publicKey) };
  }
}
