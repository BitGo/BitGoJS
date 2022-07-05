import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { Bch } from '@bitgo/sdk-coin-bch';

export class Bcha extends Bch {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Bcha(bitgo);
  }

  getChain(): string {
    return 'bcha';
  }

  getFamily(): string {
    return 'bcha';
  }

  getFullName(): string {
    return 'Bitcoin ABC';
  }
}
