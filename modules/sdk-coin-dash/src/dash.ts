import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo-beta/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo-beta/sdk-core';
import * as utxolib from '@bitgo-beta/utxo-lib';

export class Dash extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.dash);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Dash(bitgo);
  }
}
