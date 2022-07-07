import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export class Btg extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoingold);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
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
