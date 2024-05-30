import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { Bch } from '@bitgo/sdk-coin-bch';
import * as utxolib from '@bitgo/utxo-lib';
import { UtxoNetwork } from '@bitgo/abstract-utxo';

export class Bcha extends Bch {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.ecash);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Bcha(bitgo);
  }

  getChain(): string {
    return 'bcha';
  }

  getFamily(): string {
    return 'bcha';
  }

  getFullName(): string {
    return 'Bitcoin ABC';
  }

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
