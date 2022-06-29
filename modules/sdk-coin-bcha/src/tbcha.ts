/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Bcha } from './bcha';
import * as utxolib from '@bitgo/utxo-lib';

export class Tbcha extends Bcha {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.bitcoincashTestnet);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbcha(bitgo);
  }

  getChain(): string {
    return 'tbcha';
  }

  getFullName(): string {
    return 'Testnet Bitcoin ABC';
  }
}
