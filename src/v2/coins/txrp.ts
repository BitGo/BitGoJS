const Xrp = require('./xrp');

class Txrp extends Xrp {

  getChain() {
    return 'txrp';
  }

  getRippledUrl() {
    return 'https://s.altnet.rippletest.net:51234';
  }

  getFullName() {
    return 'Testnet Ripple';
  }

}

module.exports = Txrp;
