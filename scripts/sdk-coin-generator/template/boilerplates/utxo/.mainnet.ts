import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export class <%= constructor %> extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.<%= coinLowerCase %>);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new <%= constructor %>(bitgo);
  }

  getChain(): string {
    return '<%= symbol %>';
  }

  getFamily(): string {
    return '<%= symbol %>';
  }

  getFullName(): string {
    return '<%= coin %>';
  }
}
