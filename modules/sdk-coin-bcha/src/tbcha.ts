/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { Bcha } from './bcha';

export class Tbcha extends Bcha {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('af8de1e0-3e33-47bf-94d3-fb3c2bebead2');
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.ecashTest);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbcha(bitgo);
  }
}
