import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Eos } from './eos';
import * as common from '../../common';

export class Teos extends Eos {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new Teos(bitgo);
  }

  getChainId() {
    return 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'; // testnet chain id
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
