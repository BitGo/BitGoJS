/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Dash } from './dash';

export class Tdash extends Dash {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('5950d78f-e8dd-457a-ab5d-310e6b476bb1');
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.dashTest);
  }
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tdash(bitgo);
  }
}
