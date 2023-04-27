/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Polygon } from './polygon';

export class Tpolygon extends Polygon {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('aa7b72d1-9197-492d-b2ca-2c9c9732115d');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tpolygon(bitgo);
  }
}
