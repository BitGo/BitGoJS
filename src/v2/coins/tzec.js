const Zec = require('./zec');
const bitcoin = require('bitgo-utxo-lib');

class Tzec extends Zec {
  constructor() {
    super();

    // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp#L295
    this.network = bitcoin.networks.zcashTest;
  }

  getChain() {
    return 'tzec';
  }

  getFullName() {
    return 'Testnet ZCash';
  }

}

module.exports = Tzec;
