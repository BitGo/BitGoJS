/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Algo } from './algo';

export class Talgo extends Algo {
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Talgo(bitgo);
  }

  getChain(): string {
    return 'talgo';
  }

  getFullName(): string {
    return 'Testnet Algorand';
  }
}
