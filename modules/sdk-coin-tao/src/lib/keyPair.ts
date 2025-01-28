import { DotAddressFormat } from '@bitgo/sdk-core';
import { KeyPair } from '@bitgo/abstract-substrate';
import { Keyring } from '@polkadot/keyring';
import { createPair } from '@polkadot/keyring/pair';
import { KeyringPair } from '@polkadot/keyring/types';

const TYPE = 'ed25519';
const keyring = new Keyring({ type: TYPE });

export class TaoKeyPair extends KeyPair {
  constructor(keyPair: KeyPair) {
    super(keyPair);
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
}
