/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { Dash } from './dash';

export class Tdash extends Dash {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.dashTest);
  }
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tdash(bitgo);
  }

  getChain(): string {
    return 'tdash';
  }

  getFamily(): string {
    return 'tdash';
  }

  getFullName(): string {
    return 'Testnet Dash';
  }
}
