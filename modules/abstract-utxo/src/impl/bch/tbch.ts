/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';
import * as bitcoin from '@bitgo/utxo-lib';

import { Bch } from './bch';

export class Tbch extends Bch {
  constructor(bitgo: BitGoBase) {
    super(bitgo, bitcoin.networks.bitcoincashTestnet);
  }

  static createInstance(bitgo: BitGoBase): Tbch {
    return new Tbch(bitgo);
  }
}
