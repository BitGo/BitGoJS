import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Dot } from './dot';

export class Tdot extends Dot {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tdot(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'tdot';
  }

  getFullName(): string {
    return 'Testnet Polkadot';
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }
}
