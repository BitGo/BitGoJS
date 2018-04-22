const Xlm = require('./xlm');

class Txlm extends Xlm {

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
