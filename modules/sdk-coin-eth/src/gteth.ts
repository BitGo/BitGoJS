/**
 * Testnet Eth
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Eth } from './eth';

export class Gteth extends Eth {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Gteth(bitgo);
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'gteth';
  }

  getFamily(): string {
    return 'gteth';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Testnet Ethereum';
  }
}
