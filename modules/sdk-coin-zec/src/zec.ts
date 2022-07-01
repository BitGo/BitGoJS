/**
 * @prettier
 */
import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export class Zec extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.zcash);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Zec(bitgo);
  }

  getChain() {
    return 'zec';
  }

  getFamily() {
    return 'zec';
  }

  getFullName() {
    return 'ZCash';
  }

  supportsBlockTarget() {
    return false;
  }
}
