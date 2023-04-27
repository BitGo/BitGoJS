/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { Btc } from './btc';

export class Tbtc extends Btc {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('cde7559d-a536-4d12-8de4-90baa09f90bd');
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.testnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbtc(bitgo);
  }
}
