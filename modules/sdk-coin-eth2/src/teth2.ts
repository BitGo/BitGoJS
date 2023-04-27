import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Eth2 } from './eth2';

export class Teth2 extends Eth2 {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('37ee6253-04fb-4eec-bd88-310a480b1e43');
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Teth2(bitgo);
  }
}
