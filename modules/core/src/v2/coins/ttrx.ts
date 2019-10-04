/**
 * Testnet TRX - Shasta network
 *
 * @format
 */
import { BaseCoin } from '../baseCoin';
import { BitGo } from '../../bitgo';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Trx } from './trx';

export class Ttrx extends Trx {
  protected constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Ttrx(bitgo, staticsCoin);
  }
}
