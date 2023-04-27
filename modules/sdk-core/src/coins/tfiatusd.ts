/**
 * @prettier
 */
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { BaseCoin, BitGoBase } from '../';
import { FiatUsd } from './fiatusd';

export class TfiatUsd extends FiatUsd {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('8691cc4f-a425-4192-b6cb-3b0b6f646cbc');
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatUsd(bitgo);
  }
}
