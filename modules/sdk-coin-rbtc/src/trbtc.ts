/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Rbtc } from './rbtc';

export class Trbtc extends Rbtc {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('626b060b-597e-499b-88dd-414f931a743e');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Trbtc(bitgo);
  }
}
