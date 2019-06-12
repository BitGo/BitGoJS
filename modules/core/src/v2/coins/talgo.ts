/**
 * @prettier
 */
import { BaseCoin } from '../baseCoin';
import { Algo } from './algo';

export class Talgo extends Algo {
  constructor(bitgo) {
    super(bitgo);
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Talgo(bitgo);
  }

  getChain(): string {
    return 'talgo';
  }

  getFullName(): string {
    return 'Testnet Algorand';
  }
}
