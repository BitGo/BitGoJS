/**
 * @prettier
 */
import { BaseCoin } from '@bitgo/sdk-core';
import { BitGo } from '../../bitgo';
import { Algo } from './algo';

export class Talgo extends Algo {
  constructor(bitgo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Talgo(bitgo);
  }

  getChain(): string {
    return 'talgo';
  }

  getFullName(): string {
    return 'Testnet Algorand';
  }
}
