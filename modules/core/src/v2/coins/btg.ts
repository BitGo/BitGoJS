import * as utxolib from '@bitgo/utxo-lib';

import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Btc } from './btc';

export class Btg extends Btc {
  constructor(bitgo: BitGo, network?: any) {
    super(bitgo, network || utxolib.networks.bitcoingold);
  }

  static createInstance(bitgo): BaseCoin {
    return new Btg(bitgo);
  }

  getChain(): string {
    return 'btg';
  }

  getFamily(): string {
    return 'btg';
  }

  getFullName(): string {
    return 'Bitcoin Gold';
  }

  supportsBlockTarget(): boolean {
    return false;
  }
}
