/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Bch } from './bch';
import * as bitcoin from '@bitgo/utxo-lib';

export class Tbch extends Bch {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('aae6fafc-5091-4b10-9a11-aa6cefea2805');
  constructor(bitgo: BitGoBase) {
    super(bitgo, bitcoin.networks.bitcoincashTestnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbch(bitgo);
  }
}
