const Xlm = require('./xlm');
const stellar = require('stellar-sdk');

class Txlm extends Xlm {

  constructor() {
    super();
    stellar.Network.use(new stellar.Network(stellar.Networks.TESTNET));
  }

  getChain() {
    return 'txlm';
  }

  getFullName() {
    return 'Testnet Stellar';
  }

  getHorizonUrl() {
    return 'https://horizon-testnet.stellar.org';
  }
}

module.exports = Txlm;
