import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Eth } from './eth';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

export class Gteth extends Eth {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('41b75ac4-46d6-4dac-b741-bf11406b142f');
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
    this.sendMethodName = 'sendMultiSig';
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Gteth(bitgo);
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }
}
