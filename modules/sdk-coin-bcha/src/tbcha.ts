/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo-beta/sdk-core';
import * as utxolib from '@bitgo-beta/utxo-lib';
import { Bcha } from './bcha';

export class Tbcha extends Bcha {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.ecashTest);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbcha(bitgo);
  }
}
