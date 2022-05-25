/**
 * @prettier
 */
import { BaseCoin } from '@bitgo/sdk-core';
import { BitGo } from '../../bitgo';
import { Bsv } from './bsv';
import * as utxolib from '@bitgo/utxo-lib';

export class Tbsv extends Bsv {
  constructor(bitgo: BitGo) {
    super(bitgo, utxolib.networks.bitcoinsvTestnet);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tbsv(bitgo);
  }

  getChain() {
    return 'tbsv';
  }

  getFullName() {
    return 'Testnet Bitcoin SV';
  }

  getAddressPrefix() {
    return 'bchtest';
  }
}
