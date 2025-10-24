/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Btc } from './btc';

export class Tbtc extends Btc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.testnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbtc(bitgo);
  }
}
