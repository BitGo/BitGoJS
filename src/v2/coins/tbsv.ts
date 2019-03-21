const Bsv = require('./bsv');
import bitcoin = require('bitgo-utxo-lib');

class Tbsv extends Bsv {
  constructor() {
    super(bitcoin.networks.bitcoinsvTestnet);
  }

  getChain() {
    return 'tbsv';
  }

  getFullName() {
    return 'Testnet Bitcoin SV';
  }

  getAddressPrefix() {
    return 'bchtest';
  }

  /**
   * Checks if the unspent comes from the BitGo taint provider address
   * @param unspent
   * @returns {boolean}
   */
  isBitGoTaintedUnspent(unspent) {
    return unspent.address === '2MuMnPoSDgWEpNWH28X2nLtYMXQJCyT61eY';
  }
}

module.exports = Tbsv;
