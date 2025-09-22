/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo-beta/sdk-core';
import * as utxolib from '@bitgo-beta/utxo-lib';
import { Dash } from './dash';

export class Tdash extends Dash {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.dashTest);
  }
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tdash(bitgo);
  }
}
