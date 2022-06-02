import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { Btc } from './btc';

export class Btg extends Btc {
  constructor(bitgo: BitGoBase, network?: any) {
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
