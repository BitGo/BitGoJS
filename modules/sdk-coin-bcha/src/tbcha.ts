/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { Bcha } from './bcha';

export class Tbcha extends Bcha {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.ecashTest);
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
