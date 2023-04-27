import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { Zec } from './zec';

export class Tzec extends Zec {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('549a4499-387c-42d3-9048-c01d6724d98a');
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.zcashTest);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tzec(bitgo);
  }
}
