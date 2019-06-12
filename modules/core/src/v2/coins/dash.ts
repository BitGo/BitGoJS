import * as Bluebird from 'bluebird';
import { BaseCoin } from '../baseCoin';
const co = Bluebird.coroutine;
const request = require('superagent');

import { AbstractUtxoCoin } from './abstractUtxoCoin';
import * as common from '../../common';

export class Dash extends AbstractUtxoCoin {
  constructor(bitgo, network?) {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    // https://github.com/dashpay/dash/blob/master/src/chainparams.cpp#L152
    super(bitgo, network || {
      messagePrefix: '\x19Dash Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
      },
      pubKeyHash: 0x4c,
      scriptHash: 0x10,
      wif: 0xcc,
      dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
      dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
      feePerKb: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56,
      coin: 'dash'
    });
  }

  static createInstance(bitgo): BaseCoin {
    return new Dash(bitgo);
  }

  getChain() {
    return 'dash';
  }

  getFamily() {
    return 'dash';
  }

  getFullName() {
    return 'Dash';
  }

  supportsBlockTarget() {
    return false;
  }

  recoveryBlockchainExplorerUrl(url) {
    return common.Environments[this.bitgo.env].dashExplorerBaseUrl + url;
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
