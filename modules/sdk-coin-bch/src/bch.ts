import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export class Bch extends AbstractUtxoCoin {
  protected constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoincash);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Bch(bitgo);
  }

  getChain() {
    return 'bch';
  }

  getFamily() {
    return 'bch';
  }

  getFullName() {
    return 'Bitcoin Cash';
  }

  supportsBlockTarget() {
    return false;
  }

  /**
   * Canonicalize a Bitcoin Cash address for a specific version
   *
   * Starting on January 14th, 2018 Bitcoin Cash's bitcoin-abc node switched over to using cashaddr
   * encoding for all of their addresses in order to distinguish them from Bitcoin Core's.
   * https://www.bitcoinabc.org/cashaddr. We're sticking with the old base58 format because
   * migrating over to the new format will be laborious, and we want to see how the space evolves
   *
   * @param address may or may not be prefixed with the network, example bitcoincash:pppkt7q2axpsm2cajyjtu6x8fsh6ywauzgxmsru962 or pppkt7q2axpsm2cajyjtu6x8fsh6ywauzgxmsru962
   * @param version the version of the desired address, 'base58' or 'cashaddr', defaulting to 'base58'
   * @returns {*} address string
   */
  canonicalAddress(address: string, version: unknown = 'base58'): string {
    if (version === 'base58') {
      return utxolib.addressFormat.toCanonicalFormat(address, this.network);
    }

    if (version === 'cashaddr') {
      const script = utxolib.addressFormat.toOutputScriptTryFormats(address, this.network);
      return utxolib.addressFormat.fromOutputScriptWithFormat(script, version, this.network);
    }

    throw new Error(`invalid version ${version}`);
  }
}
