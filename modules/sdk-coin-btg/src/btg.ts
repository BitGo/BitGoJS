import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo-beta/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo-beta/sdk-core';
import * as utxolib from '@bitgo-beta/utxo-lib';

export class Btg extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoingold);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Btg(bitgo);
  }
}
