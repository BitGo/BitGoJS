/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Ltc } from './ltc';
import * as utxolib from '@bitgo/utxo-lib';

export class Tltc extends Ltc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.litecoinTest);
    this.altScriptHash = utxolib.networks.testnet.scriptHash;
    // support alt destinations on test
    this.supportAltScriptDestination = false;
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tltc(bitgo);
  }

  getChain() {
    return 'tltc';
  }

  getFullName() {
    return 'Testnet Litecoin';
  }
}
