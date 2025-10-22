import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, UtxoNetwork } from '../../abstractUtxoCoin';

export class Bch extends AbstractUtxoCoin {
  protected constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoincash);
  }

  static createInstance(bitgo: BitGoBase): Bch {
    return new Bch(bitgo);
  }
}
