/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Lnbtc } from './lnbtc';
import * as utxolib from '@bitgo/utxo-lib';

export class Tlnbtc extends Lnbtc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.testnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tlnbtc(bitgo);
  }

  getChain(): string {
    return 'tlnbtc';
  }

  getFullName(): string {
    return 'Testnet LightningBitcoin';
  }
}
