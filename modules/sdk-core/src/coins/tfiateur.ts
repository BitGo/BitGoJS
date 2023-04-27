/**
 * @prettier
 */
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { BaseCoin, BitGoBase } from '../';
import { FiatEur } from './fiateur';

export class TfiatEur extends FiatEur {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('5d22d71c-49a7-42ff-8367-744b59b5fe88');
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatEur(bitgo);
  }
}
