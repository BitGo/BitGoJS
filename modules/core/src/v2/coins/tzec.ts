import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Zec } from './zec';
import * as utxolib from '@bitgo/utxo-lib';

export class Tzec extends Zec {
  constructor(bitgo: BitGo) {
    super(bitgo, utxolib.networks.zcashTest);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tzec(bitgo);
  }

  getChain() {
    return 'tzec';
  }

  getFullName() {
    return 'Testnet ZCash';
  }
}
