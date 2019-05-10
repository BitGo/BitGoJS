const Eth = require('./eth');

class Teth extends Eth {

  getChain() {
    return 'teth';
  }

  getFullName() {
    return 'Testnet Ethereum';
  }

}

module.exports = Teth;
