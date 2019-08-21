/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Btc } from './btc';
import * as bitcoin from 'bitgo-utxo-lib';

export class Tbtc extends Btc {
  constructor(bitgo) {
    super(bitgo, bitcoin.networks.testnet);
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
