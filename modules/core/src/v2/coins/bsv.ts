/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';

import { UtxoNetwork } from './abstractUtxoCoin';
import { BaseCoin } from '../baseCoin';
import { Bch } from './bch';
import { BitGo } from '../../bitgo';

export class Bsv extends Bch {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoinsv);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Bsv(bitgo);
  }

  getChain(): string {
    return 'bsv';
  }

  getFamily(): string {
    return 'bsv';
  }

  getFullName(): string {
    return 'Bitcoin SV';
  }
}
