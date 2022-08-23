/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { Doge } from './doge';

export class Tdoge extends Doge {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.dogecoinTest);
  }
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tdoge(bitgo);
  }

  getChain(): string {
    return 'tdoge';
  }

  getFullName(): string {
    return 'Testnet Dogecoin';
  }
}
