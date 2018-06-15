const Xlm = require('./xlm');
const stellar = require('stellar-base');

class Txlm extends Xlm {

  constructor() {
    super();
    stellar.Network.use(new stellar.Network(stellar.Networks.TESTNET));
  }

  getChain() {
    return 'txlm';
  }

  getRippledUrl() {
    return 'https://s.altnet.rippletest.net:51234';
  }

  getFullName() {
    return 'Testnet Stellar';
  }

}

module.exports = Txlm;
