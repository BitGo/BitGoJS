/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { Bsv } from './bsv';

export class Tbsv extends Bsv {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('7cb81518-85d7-400f-960e-7bc00b3bfa62');
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinsvTestnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbsv(bitgo);
  }
}
