const Bch = require('./bch');
const bitcoin = require('bitgo-utxo-lib');

class Tbch extends Bch {
  constructor() {
    super();
    this.network = bitcoin.networks.bitcoincashTestnet;
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
