import { BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { AvaxP } from './avaxp';
import { BaseCoin as StaticsBaseCoin } from '@bitgo-beta/statics';

export class TavaxP extends AvaxP {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new TavaxP(bitgo, staticsCoin);
  }
}
