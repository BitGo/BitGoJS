const AbstractUtxoCoin = require('./abstractUtxoCoin');
const bitcoin = require('bitgo-utxo-lib');

class Zec extends AbstractUtxoCoin {
  constructor() {
    super();

    // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp#L140
    this.network = bitcoin.networks.zcash;
  }

  getChain() {
    return 'zec';
  }

  getFamily() {
    return 'zec';
  }

  getCoinLibrary() {
    return bitcoin;
  }

  getFullName() {
    return 'ZCash';
  }

  supportsBlockTarget() {
    return false;
  }

  /**
   *
   * @param txBuilder
   * @returns {*}
   */
  static prepareTransactionBuilder(txBuilder) {
    txBuilder.setVersion(3);
    txBuilder.setVersionGroupId(63210096);
    return txBuilder;
  }

  /**
   * Calculate the hash to verify the signature against
   * @param transaction Transaction object
   * @param inputIndex
   * @param pubScript
   * @param amount The previous output's amount
   * @param hashType
   * @param isSegwitInput
   * @returns {*}
   */
  calculateSignatureHash(transaction, inputIndex, pubScript, amount, hashType, isSegwitInput) {
    return transaction.hashForZcashSignature(inputIndex, pubScript, amount, hashType);
  }

}

module.exports = Zec;
