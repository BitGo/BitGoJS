import { BaseCoin } from '../baseCoin';
import { Xlm } from './xlm';
const stellar = require('stellar-sdk');

export class Txlm extends Xlm {

  constructor(bitgo: any) {
    super(bitgo);
    stellar.Network.use(new stellar.Network(stellar.Networks.TESTNET));
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Txlm(bitgo);
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
