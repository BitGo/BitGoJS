import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Eth2 } from './eth2';

export class Teth2 extends Eth2 {
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Teth2(bitgo);
  }

  getChain() {
    return 'teth2';
  }

  getFullName() {
    return 'Testnet Ethereum 2.0';
  }
}
