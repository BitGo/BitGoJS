/**
 * @prettier
 */
import { BaseCoin } from '@bitgo/sdk-core';
import { BitGo } from '../../bitgo';
import { Btc } from './btc';
import * as utxolib from '@bitgo/utxo-lib';

export class Tbtc extends Btc {
  constructor(bitgo) {
    super(bitgo, utxolib.networks.testnet);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tbtc(bitgo);
  }

  getChain() {
    return 'tbtc';
  }

  getFullName() {
    return 'Testnet Bitcoin';
  }
}
