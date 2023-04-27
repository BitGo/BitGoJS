/**
 * @prettier
 */
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { BaseCoin, BitGoBase } from '../';
import { Susd } from './susd';

export class Tsusd extends Susd {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('e424034a-22e6-4bcf-bd04-c598507afe3d');
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tsusd(bitgo);
  }
}
