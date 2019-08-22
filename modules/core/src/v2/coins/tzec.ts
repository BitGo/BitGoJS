import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Zec, ZecTransactionBuilder } from './zec';
import * as bitGoUtxoLib from 'bitgo-utxo-lib';

export class Tzec extends Zec {
  constructor(bitgo: BitGo) {
    super(bitgo, bitGoUtxoLib.networks.zcashTest);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
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
  prepareTransactionBuilder(txBuilder: ZecTransactionBuilder): any {
    txBuilder.setVersion(bitGoUtxoLib.Transaction.ZCASH_SAPLING_VERSION);
    txBuilder.setVersionGroupId(0x892f2085);
    return txBuilder;
  }
}
