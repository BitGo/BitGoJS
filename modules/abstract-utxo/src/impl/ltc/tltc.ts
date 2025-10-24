import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Ltc } from './ltc';

export class Tltc extends Ltc {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.litecoinTest);
    this.altScriptHash = utxolib.networks.testnet.scriptHash;
    // support alt destinations on test
    this.supportAltScriptDestination = false;
  }
  static createInstance(bitgo: BitGoBase): Tltc {
    return new Tltc(bitgo);
  }
}
