/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Btc } from './btc';

export class Tbtcsig extends Btc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinPublicSignet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbtcsig(bitgo);
  }
}
