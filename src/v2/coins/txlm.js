const Xlm = require('./xlm');
const stellar = require('stellar-sdk');

class Txlm extends Xlm {

  constructor() {
    super();
    stellar.Network.use(new stellar.Network(stellar.Networks.TESTNET));
    this.federationServer = new stellar.FederationServer(this.getFederationServerUrl(), 'bitgo.com');
  }

  getChain() {
    return 'txlm';
  }

  getFullName() {
    return 'Testnet Stellar';
  }

  getFederationServerUrl() {
    return 'https://test.bitgo.com/api/v2/txlm/federation';
  }

  getHorizonUrl() {
    return 'https://horizon-testnet.stellar.org';
  }
}

module.exports = Txlm;
