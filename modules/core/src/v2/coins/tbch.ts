const Bch = require('./bch');
import bitcoin = require('bitgo-utxo-lib');

class Tbch extends Bch {
  constructor() {
    super(bitcoin.networks.bitcoincashTestnet);
  }

  getChain() {
    return 'tbch';
  }

  getFullName() {
    return 'Testnet Bitcoin Cash';
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

module.exports = Tbch;
