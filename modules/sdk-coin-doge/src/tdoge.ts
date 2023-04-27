/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { Doge } from './doge';

export class Tdoge extends Doge {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('7a1597e8-fd8e-4b68-8086-f9159e37e0ce');
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.dogecoinTest);
  }
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tdoge(bitgo);
  }
}
