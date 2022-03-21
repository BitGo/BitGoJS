import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Xlm } from './xlm';
const stellar = require('stellar-sdk');

export class Txlm extends Xlm {
  constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Txlm(bitgo);
  }

  protected getStellarNetwork() {
    return stellar.Networks.TESTNET;
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
