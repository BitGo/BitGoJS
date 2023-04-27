import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Eos } from './eos';

export class Teos extends Eos {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('024af1f1-41d8-4df9-b8a1-df74dac5907a');
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Teos(bitgo);
  }

  getPublicNodeUrls(): string[] {
    return common.Environments[this.bitgo.getEnv()].eosNodeUrls;
  }
}
