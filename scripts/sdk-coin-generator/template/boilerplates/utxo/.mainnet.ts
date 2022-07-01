import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export class <%= constructor %> extends AbstractUtxoCoin {
  protected constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.<%= coinLowerCase %>);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new <%= constructor %>(bitgo);
  }

  getChain() {
    return '<%= symbol %>';
  }

  getFamily() {
    return '<%= symbol %>';
  }

  getFullName() {
    return '<%= coin %>';
  }
}
