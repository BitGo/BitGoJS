/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Etc } from './etc';

export class Tetc extends Etc {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('49c048a1-40b3-4c85-8bbd-adf7ef9393be');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tetc(bitgo);
  }
}
