import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Xlm } from './xlm';
const stellar = require('stellar-sdk');

export class Txlm extends Xlm {
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
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
