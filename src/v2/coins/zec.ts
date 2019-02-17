const AbstractUtxoCoin = require('./abstractUtxoCoin');
const bitGoUtxoLib = require('bitgo-utxo-lib');
import common = require('../../common');
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

  async getAddressInfoFromExplorer(addressBase58) {
    const addrInfo = await request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

    addrInfo.txCount = addrInfo.txApperances;
    addrInfo.totalBalance = addrInfo.balanceSat;

    return addrInfo;
  }

  async getUnspentInfoFromExplorer(addressBase58) {
    const unspents = await request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}/utxo`)).result();

    unspents.forEach(function processUnspent(unspent) {
      unspent.amount = unspent.satoshis;
      unspent.n = unspent.vout;
    });

    return unspents;
  }
}

module.exports = Zec;
