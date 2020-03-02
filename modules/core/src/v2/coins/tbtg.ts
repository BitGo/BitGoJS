import * as utxolib from '@bitgo/utxo-lib';
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Btg } from './btg';

export class Tbtg extends Btg {
  constructor(bitgo: BitGo) {
    super(bitgo, utxolib.networks.bitcoinGold);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tbtg(bitgo);
  }

  getChain() {
    return 'tbtg';
  }

  getFullName() {
    return 'Testnet Bitcoin Gold';
  }
}
