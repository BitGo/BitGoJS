const tronweb = require('tronweb');

import { BaseCoin } from '../baseCoin';

export class Trx extends BaseCoin {

  constructor(bitgo) {
    super(bitgo);
  }

  getChain() {
    return 'trx';
  }

  getFamily() {
    return 'trx';
  }

  getFullName() {
    return 'Tron';
  }

  getBaseFactor() {
    return 1e6;
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Trx(bitgo);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
      return true;
  }

  isValidAddress(address: string): boolean {
    return this.getCoinLibrary().isAddress(address);
  }

  /**
   * Get an instance of the library which can be used to perform low-level operations for this coin
   */
  getCoinLibrary() {
    return tronweb;
  }
}
