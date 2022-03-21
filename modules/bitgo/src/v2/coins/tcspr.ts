import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Cspr } from './cspr';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Tcspr extends Cspr {

  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tcspr(bitgo, staticsCoin);
  }

  getChain() {
    return this._staticsCoin.name;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }
}
