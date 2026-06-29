import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Tempo } from './tempo';

export class Ttempo extends Tempo {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Ttempo(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'ttempo';
  }

  getFullName(): string {
    return 'Testnet Tempo';
  }
}
