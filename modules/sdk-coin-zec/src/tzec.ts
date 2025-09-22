import { BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { Zec } from './zec';
import * as utxolib from '@bitgo-beta/utxo-lib';

export class Tzec extends Zec {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.zcashTest);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tzec(bitgo);
  }
}
