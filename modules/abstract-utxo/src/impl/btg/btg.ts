import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, UtxoNetwork } from '../../abstractUtxoCoin';

export class Btg extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoingold);
  }

  static createInstance(bitgo: BitGoBase): Btg {
    return new Btg(bitgo);
  }
}
