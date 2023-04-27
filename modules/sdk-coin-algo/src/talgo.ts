/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Algo } from './algo';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

export class Talgo extends Algo {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('9595aa8c-7add-4ede-a61b-b176cadade81');
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Talgo(bitgo);
  }
}
