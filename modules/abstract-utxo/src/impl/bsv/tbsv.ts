/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Bsv } from './bsv';

export class Tbsv extends Bsv {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinsvTestnet);
  }

  static createInstance(bitgo: BitGoBase): Tbsv {
    return new Tbsv(bitgo);
  }
}
