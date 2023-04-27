import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Eth } from './eth';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

export class Teth extends Eth {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('25f9ade1-d768-45ec-8b44-e55c2e5f472d');
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
    this.sendMethodName = 'sendMultiSig';
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Teth(bitgo);
  }
}
