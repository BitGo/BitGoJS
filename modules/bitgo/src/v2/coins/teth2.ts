import { BaseCoin } from '@bitgo/sdk-core';
import { BitGo } from '../../bitgo';
import { Eth2 } from './eth2';

export class Teth2 extends Eth2 {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new Teth2(bitgo);
  }

  getChain() {
    return 'teth2';
  }

  getFullName() {
    return 'Testnet Ethereum 2.0';
  }
}
