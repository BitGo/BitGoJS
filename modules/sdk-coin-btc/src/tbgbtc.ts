/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Btc } from './btc';
import * as utxolib from '@bitgo/utxo-lib';

export class Tbgbtc extends Btc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinBitGoSignet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbgbtc(bitgo);
  }

  getChain(): string {
    return 'tbgbtc';
  }

  getFullName(): string {
    return 'BitGo Signet Bitcoin';
  }
}
