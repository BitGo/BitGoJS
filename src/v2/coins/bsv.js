const Bch = require('./bch');
const bitcoin = require('bitgo-utxo-lib');
const request = require('superagent');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../common');

class Bsv extends Bch {

  constructor(network) {
    super(network || bitcoin.networks.bitcoinsv);
  }

  getChain() {
    return 'bsv';
  }

  getFamily() {
    return 'bsv';
  }

  getFullName() {
    return 'Bitcoin SV';
  }

  recoveryBlockchainExplorerUrl(url) {
    return common.Environments[this.bitgo.env].bsvExplorerBaseUrl + url;
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

module.exports = Bsv;
