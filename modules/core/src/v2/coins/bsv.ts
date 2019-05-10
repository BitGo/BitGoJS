const Bch = require('./bch');
const bitcoin = require('bitgo-utxo-lib');
const request = require('superagent');
import * as Promise from 'bluebird';
const co = Promise.coroutine;
import common = require('../../common');
const errors = require('../../errors');

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
    const baseUrl = common.Environments[this.bitgo.env].bsvExplorerBaseUrl;

    // TODO BG-9989: There is no explorer api for Bitcoin SV yet. Once we have one, add it to src/common.js and update
    // this method.
    if (!baseUrl) {
      throw new errors.WalletRecoveryUnsupported(`Recoveries not supported for ${this.getChain()} - no explorer available`);
    }

    return common.Environments[this.bitgo.env].bsvExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58) {
    return co(function *getAddressInfoFromExplorer() {
      // TODO BG-9989: Update this method with the correct API route and parsing once we have one
      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58) {
    return co(function *getUnspentInfoFromExplorer() {
      // TODO BG-9989: Update this method with the correct API route and parsing once we have one
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
