/**
 * Testnet Algo
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Algo } from './algo';

export class Talgo extends Algo {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Talgo(bitgo);
  }
  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'talgo';
  }

  getFamily(): string {
    return 'talgo';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Testnet Algorand';
  }
}
