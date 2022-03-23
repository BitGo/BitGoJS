/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Dash } from './dash';

export class Tdash extends Dash {
  constructor(bitgo: BitGo) {
    super(bitgo, utxolib.networks.dashTest);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tdash(bitgo);
  }

  getChain() {
    return 'tdash';
  }

  getFullName() {
    return 'Testnet Dash';
  }
}
