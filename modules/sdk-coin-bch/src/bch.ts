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
}
