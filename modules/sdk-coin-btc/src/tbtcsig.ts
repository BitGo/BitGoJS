/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { Btc } from './btc';
import * as utxolib from '@bitgo-beta/utxo-lib';

export class Tbtcsig extends Btc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinPublicSignet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbtcsig(bitgo);
  }
}
