/**
 * @prettier
 */
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { BaseCoin, BitGoBase } from '../';
import { FiatGBP } from './fiatgbp';

export class TfiatGBP extends FiatGBP {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('c32e8edc-ec51-4084-9b81-3426605f13b9');
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatGBP(bitgo);
  }
}
