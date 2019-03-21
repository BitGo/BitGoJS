const Zec = require('./zec');
import bitGoUtxoLib = require('bitgo-utxo-lib');

class Tzec extends Zec {
  constructor() {
    super(bitGoUtxoLib.networks.zcashTest);
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

module.exports = Tzec;
