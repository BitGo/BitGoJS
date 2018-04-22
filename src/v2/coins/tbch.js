const Bch = require('./bch');
const bitcoinCash = require('bitgo-bitcoinjs-lib');

class Tbch extends Bch {
  constructor() {
    super();
    this.network = bitcoinCash.networks.testnet;
    this.bchPrefix = 'bchtest';
  }

  getChain() {
    return 'tbch';
  }

  getFullName() {
    return 'Testnet Bitcoin Cash';
  }

}

module.exports = Tbch;
