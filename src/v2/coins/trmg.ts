const Rmg = require('./rmg');
import prova = require('../../prova');

class Trmg extends Rmg {
  constructor() {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    (prova as any).networks.rmgTest.coin = 'rmg';
    super((prova as any).networks.rmgTest);
  }

  getChain() {
    return 'trmg';
  }

  getFullName() {
    return 'Testnet Royal Mint Gold';
  }

}

module.exports = Trmg;
