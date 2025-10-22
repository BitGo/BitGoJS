import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Zec } from './zec';

export class Tzec extends Zec {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.zcashTest);
  }

  static createInstance(bitgo: BitGoBase): Tzec {
    return new Tzec(bitgo);
  }
}
