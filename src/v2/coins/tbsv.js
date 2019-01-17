const Bsv = require('./bsv');
const bitcoin = require('bitgo-utxo-lib');

class Tbsv extends Bsv {
  constructor() {
    super(bitcoin.networks.bitcoincashTestnet);
  }

  getChain() {
    return 'tbsv';
  }

  getFullName() {
    return 'Testnet Bitcoin SVV';
  }

  getAddressPrefix() {
    return 'bchtest';
  }
}

module.exports = Tbsv;
