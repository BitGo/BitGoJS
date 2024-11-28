import { UtxoNetwork } from '@bitgo/abstract-utxo';
import { Bch } from '@bitgo/sdk-coin-bch';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export class Bsv extends Bch {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoinsv);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Bsv(bitgo);
  }
}
