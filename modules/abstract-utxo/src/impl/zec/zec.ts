/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, UtxoNetwork } from '../../abstractUtxoCoin';

export class Zec extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.zcash);
  }

  static createInstance(bitgo: BitGoBase): Zec {
    return new Zec(bitgo);
  }
}
