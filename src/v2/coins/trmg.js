const Rmg = require('./rmg');
const prova = require('../../prova');

class Trmg extends Rmg {
  constructor() {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    prova.networks.rmgTest.coin = 'rmg';
    super(prova.networks.rmgTest);
  }

  getChain() {
    return 'trmg';
  }

  getFullName() {
    return 'Testnet Royal Mint Gold';
  }

}

module.exports = Trmg;
