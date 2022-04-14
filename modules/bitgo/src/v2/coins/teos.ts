import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Eos } from './eos';
import { common } from '@bitgo/sdk-core';

export class Teos extends Eos {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new Teos(bitgo);
  }

  getChainId() {
    return '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840'; // testnet chain id
  }

  getChain() {
    return 'teos';
  }

  getFullName() {
    return 'Testnet EOS';
  }

  getPublicNodeUrls(): string[] {
    return common.Environments[this.bitgo.getEnv()].eosNodeUrls;
  }
}
