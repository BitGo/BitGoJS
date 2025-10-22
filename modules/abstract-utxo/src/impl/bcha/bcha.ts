import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Bch } from '../bch/bch';
import { UtxoNetwork } from '../../abstractUtxoCoin';

export class Bcha extends Bch {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.ecash);
  }

  static createInstance(bitgo: BitGoBase): Bcha {
    return new Bcha(bitgo);
  }
}
