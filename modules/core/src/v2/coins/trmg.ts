/**
 * @prettier
 */
import { BaseCoin } from '../baseCoin';
import { Rmg } from './rmg';
import prova = require('../../prova');

export class Trmg extends Rmg {
  constructor(bitgo) {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    (prova as any).networks.rmgTest.coin = 'rmg';
    super(bitgo, (prova as any).networks.rmgTest);
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Trmg(bitgo);
  }

  getChain() {
    return 'trmg';
  }

  getFullName() {
    return 'Testnet Royal Mint Gold';
  }
}
