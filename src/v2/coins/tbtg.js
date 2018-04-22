const Btg = require('./btg');
const bitcoin = require('bitgo-bitcoinjs-lib');

class Tbtg extends Btg {
  constructor() {
    super();
    this.network = bitcoin.networks.testnet;
  }

  getChain() {
    return 'tbtg';
  }

  getFullName() {
    return 'Testnet Bitcoin Gold';
  }

}

module.exports = Tbtg;
