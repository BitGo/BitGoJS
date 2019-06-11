import { BaseCoin } from '../baseCoin';
import { Zec } from './zec';
import * as bitGoUtxoLib from 'bitgo-utxo-lib';

export class Tzec extends Zec {
  constructor(bitgo) {
    super(bitgo, bitGoUtxoLib.networks.zcashTest);
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Tzec(bitgo);
  }

  getChain() {
    return 'tzec';
  }

  getFullName() {
    return 'Testnet ZCash';
  }

  /**
   * Set up default parameters to send a Zcash Sapling compatible transaction
   * @param txBuilder
   * @returns {*}
   */
  prepareTransactionBuilder(txBuilder) {
    txBuilder.setVersion(bitGoUtxoLib.Transaction.ZCASH_SAPLING_VERSION);
    txBuilder.setVersionGroupId(0x892f2085);
    return txBuilder;
  }
}
