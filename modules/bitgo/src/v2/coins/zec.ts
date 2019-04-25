const AbstractUtxoCoin = require('./abstractUtxoCoin');
import bitGoUtxoLib = require('bitgo-utxo-lib');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../common');
const request = require('superagent');

class Zec extends AbstractUtxoCoin {
  constructor(network) {
    super(network || bitGoUtxoLib.networks.zcash);
  }

  getChain() {
    return 'zec';
  }

  getFamily() {
    return 'zec';
  }

  getCoinLibrary() {
    return bitGoUtxoLib;
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
  prepareTransactionBuilder(txBuilder) {
    txBuilder.setVersion(bitGoUtxoLib.Transaction.ZCASH_SAPLING_VERSION);
    txBuilder.setVersionGroupId(0x892f2085);
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

export = Zec;
