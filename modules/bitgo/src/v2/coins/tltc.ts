/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Ltc } from './ltc';
import * as utxolib from '@bitgo/utxo-lib';

export class Tltc extends Ltc {
  constructor(bitgo: BitGo) {
    super(bitgo, utxolib.networks.litecoinTest);
    this.altScriptHash = utxolib.networks.testnet.scriptHash;
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
