/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Bch } from './bch';
import * as bitcoin from 'bitgo-utxo-lib';

export class Tbch extends Bch {
  constructor(bitgo: BitGo) {
    super(bitgo, bitcoin.networks.bitcoincashTestnet);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tbch(bitgo);
  }

  getChain() {
    return 'tbch';
  }

  getFullName() {
    return 'Testnet Bitcoin Cash';
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
