const AbstractUtxoCoin = require('./abstractUtxoCoin');
const bitcoin = require('bitgo-utxo-lib');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../common');
const request = require('superagent');

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

  recoveryBlockchainExplorerUrl(url) {
    return common.Environments[this.bitgo.env].zecExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58) {
    return co(function *getAddressInfoFromExplorer() {
      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58) {
    return co(function *getUnspentInfoFromExplorer() {
      const unspents = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}/utxo`)).result();

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }
}

module.exports = Zec;
