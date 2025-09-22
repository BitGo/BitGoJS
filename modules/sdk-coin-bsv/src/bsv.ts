import { UtxoNetwork } from '@bitgo-beta/abstract-utxo';
import { Bch } from '@bitgo-beta/sdk-coin-bch';
import { BitGoBase, BaseCoin } from '@bitgo-beta/sdk-core';
import * as utxolib from '@bitgo-beta/utxo-lib';

export class Bsv extends Bch {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoinsv);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Bsv(bitgo);
  }
}
