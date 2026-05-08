/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Lnbtc } from './lnbtc';
import * as utxolib from '@bitgo/utxo-lib';

export class Tlnbtc extends Lnbtc {
  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, utxolib.networks.testnet, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tlnbtc(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'tlnbtc';
  }

  getFullName(): string {
    return 'Testnet Lightning Bitcoin';
  }
}
