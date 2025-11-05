/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Btc } from './btc';

export class Tbtc4 extends Btc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinTestnet4);
  }

  static createInstance(bitgo: BitGoBase): Tbtc4 {
    return new Tbtc4(bitgo);
  }
}
