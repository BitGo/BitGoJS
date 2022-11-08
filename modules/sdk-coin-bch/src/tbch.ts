/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Bch } from './bch';
import * as bitcoin from '@bitgo/utxo-lib';

export class Tbch extends Bch {
  constructor(bitgo: BitGoBase) {
    super(bitgo, bitcoin.networks.bitcoincashTestnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbch(bitgo);
  }

  getChain() {
    return 'tbch';
  }

  getFullName() {
    return 'Testnet Bitcoin Cash';
  }
}
