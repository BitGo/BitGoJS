import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Xlm } from './xlm';
const stellar = require('stellar-sdk');

export class Txlm extends Xlm {
  constructor(bitgo: BitGo) {
    super(bitgo);
    stellar.Network.use(new stellar.Network(stellar.Networks.TESTNET));
  }

  static createInstance(bitgo: BitGo): BaseCoin {
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
