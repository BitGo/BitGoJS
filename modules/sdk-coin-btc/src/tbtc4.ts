/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Btc } from './btc';
import * as utxolib from '@bitgo/utxo-lib';

export class Tbtc4 extends Btc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinTestnet4);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbtc4(bitgo);
  }
}
