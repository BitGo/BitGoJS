import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Zec } from './zec';
import * as utxolib from '@bitgo/utxo-lib';

export class Tzec extends Zec {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.zcashTest);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tzec(bitgo);
  }

  getChain() {
    return 'tzec';
  }

  getFullName() {
    return 'Testnet ZCash';
  }
}
