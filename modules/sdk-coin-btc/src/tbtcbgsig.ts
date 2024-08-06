/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Btc } from './btc';
import * as utxolib from '@bitgo/utxo-lib';

export class Tbtcbgsig extends Btc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinBitGoSignet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbtcbgsig(bitgo);
  }

  getChain(): string {
    return 'tbtcbgsig';
  }

  getFullName(): string {
    return 'BitGo Signet Bitcoin';
  }
}
