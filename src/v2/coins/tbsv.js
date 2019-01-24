const Bsv = require('./bsv');
const bitcoin = require('bitgo-utxo-lib');

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
}

module.exports = Tbsv;
