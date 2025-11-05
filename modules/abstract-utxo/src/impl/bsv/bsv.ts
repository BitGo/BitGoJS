import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { UtxoNetwork } from '../../abstractUtxoCoin';
import { Bch } from '../bch/bch';

export class Bsv extends Bch {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoinsv);
  }

  static createInstance(bitgo: BitGoBase): Bsv {
    return new Bsv(bitgo);
  }
}
