/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo-beta/sdk-core';
import { Bsv } from './bsv';
import * as utxolib from '@bitgo-beta/utxo-lib';

export class Tbsv extends Bsv {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinsvTestnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbsv(bitgo);
  }
}
