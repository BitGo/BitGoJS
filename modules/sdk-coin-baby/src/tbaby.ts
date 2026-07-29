/**
 * Testnet Babylon
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Baby } from './baby';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Tbaby extends Baby {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tbaby(bitgo, staticsCoin);
  }
}
