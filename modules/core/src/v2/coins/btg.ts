const Btc = require('./btc');
const bitcoin = require('bitgo-utxo-lib');
import * as Promise from 'bluebird';
const request = require('superagent');
const co = Promise.coroutine;
import common = require('../../common');

class Btg extends Btc {
  constructor(network) {
    super(network || bitcoin.networks.bitcoingold);
  }

  getChain() {
    return 'btg';
  }

  getFamily() {
    return 'btg';
  }

  getFullName() {
    return 'Bitcoin Gold';
  }

  supportsBlockTarget() {
    return false;
  }

  supportsP2shP2wsh() {
    return true;
  }

  supportsP2wsh() {
    return true;
  }

  /**
   *
   * @param txBuilder
   * @returns {*}
   */
  prepareTransactionBuilder(txBuilder) {
    txBuilder.setVersion(2);
    return txBuilder;
  }

  /**
   *
   * @returns {number}
   */
  get defaultSigHashType() {
    return bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143;
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
    return transaction.hashForGoldSignature(inputIndex, pubScript, amount, hashType, isSegwitInput);
  }

  recoveryBlockchainExplorerUrl(url) {
    const baseUrl = common.Environments[this.bitgo.env].btgExplorerBaseUrl;

    if (!baseUrl) {
      throw new Error(`Recoveries not supported for ${this.getChain()} - no explorer available`);
    }

    return common.Environments[this.bitgo.env].btgExplorerBaseUrl + url;
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

module.exports = Btg;
