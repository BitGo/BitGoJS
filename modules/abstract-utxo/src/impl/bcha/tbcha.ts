/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { Bcha } from './bcha';

export class Tbcha extends Bcha {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.ecashTest);
  }

  static createInstance(bitgo: BitGoBase): Tbcha {
    return new Tbcha(bitgo);
  }
}
