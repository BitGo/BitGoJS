const Zec = require('./zec');
const bitcoin = require('bitgo-utxo-lib');

class Tzec extends Zec {
  constructor() {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    super(bitcoin.networks.zcashTest);
  }

  getChain() {
    return 'tzec';
  }

  getFullName() {
    return 'Testnet ZCash';
  }

}

module.exports = Tzec;
