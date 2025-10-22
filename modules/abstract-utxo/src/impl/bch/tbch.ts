/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import * as bitcoin from '@bitgo/utxo-lib';

import { Bch } from './bch';

export class Tbch extends Bch {
  constructor(bitgo: BitGoBase) {
    super(bitgo, bitcoin.networks.bitcoincashTestnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbch(bitgo);
  }
}
