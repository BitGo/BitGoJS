import { AbstractLightningCoin } from '@bitgo/abstract-lightning';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

export class Lnbtc extends AbstractLightningCoin {
  constructor(bitgo: BitGoBase, network?: utxolib.Network, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, network || utxolib.networks.bitcoin, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Lnbtc(bitgo, undefined, staticsCoin);
  }

  getChain(): string {
    return 'lnbtc';
  }

  getFamily(): string {
    return 'lnbtc';
  }

  getFullName(): string {
    return 'Lightning Bitcoin';
  }
}
