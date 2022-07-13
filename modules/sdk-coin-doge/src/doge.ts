import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export class Doge extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.dogecoin);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Doge(bitgo);
  }

  getChain(): string {
    return 'doge';
  }

  getFamily(): string {
    return 'doge';
  }

  getFullName(): string {
    return 'Dogecoin';
  }

  supportsBlockTarget(): boolean {
    return true;
  }
}
