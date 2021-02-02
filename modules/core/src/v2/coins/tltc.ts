/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Ltc } from './ltc';
import * as bitcoin from '@bitgo/utxo-lib';

export class Tltc extends Ltc {
  constructor(bitgo: BitGo) {
    super(bitgo, bitcoin.networks.litecoinTest);
    this.altScriptHash = bitcoin.networks.testnet.scriptHash;
    // support alt destinations on test
    this.supportAltScriptDestination = false;
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tltc(bitgo);
  }

  getChain() {
    return 'tltc';
  }

  getFullName() {
    return 'Testnet Litecoin';
  }
}
