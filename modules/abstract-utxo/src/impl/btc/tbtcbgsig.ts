/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Btc } from './btc';

export class Tbtcbgsig extends Btc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinBitGoSignet);
  }

  static createInstance(bitgo: BitGoBase): Tbtcbgsig {
    return new Tbtcbgsig(bitgo);
  }
}
