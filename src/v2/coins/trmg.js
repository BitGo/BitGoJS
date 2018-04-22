const Rmg = require('./rmg');
const prova = require('../../prova');

class Trmg extends Rmg {
  constructor() {
    super();
    this.network = prova.networks.rmgTest;
  }

  getChain() {
    return 'trmg';
  }

  getFullName() {
    return 'Testnet Royal Mint Gold';
  }

}

module.exports = Trmg;
