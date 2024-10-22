/**
 * Testnet Rune
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Rune } from './rune';

export class Trune extends Rune {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Trune(bitgo) as unknown as BaseCoin;
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'trune';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Testnet Rune';
  }
}
