/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Bsv } from './bsv';
import * as bitcoin from 'bitgo-utxo-lib';

export class Tbsv extends Bsv {
  constructor(bitgo: BitGo) {
    super(bitgo, bitcoin.networks.bitcoinsvTestnet);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tbsv(bitgo);
  }

  getChain() {
    return 'tbsv';
  }

  getFullName() {
    return 'Testnet Bitcoin SV';
  }

  getAddressPrefix() {
    return 'bchtest';
  }

  /**
   * Checks if the unspent comes from the BitGo taint provider address
   * @param unspent
   * @returns {boolean}
   */
  isBitGoTaintedUnspent(unspent) {
    return unspent.address === '2MuMnPoSDgWEpNWH28X2nLtYMXQJCyT61eY';
  }
}
