/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { Bsv } from './bsv';
import * as utxolib from '@bitgo/utxo-lib';

export class Tbsv extends Bsv {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoinsvTestnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbsv(bitgo);
  }

  getChain(): string {
    return 'tbsv';
  }

  getFullName(): string {
    return 'Testnet Bitcoin SV';
  }
}
