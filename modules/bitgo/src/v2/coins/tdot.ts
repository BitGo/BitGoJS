import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Dot } from './dot';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Tdot extends Dot {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
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
