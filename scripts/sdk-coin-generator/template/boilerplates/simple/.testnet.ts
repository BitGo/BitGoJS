/**
 * Testnet <%= constructor %>
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { <%= constructor %> } from './<%= symbol %>';

export class <%= testnetConstructor %> extends <%= constructor %> {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new <%= testnetConstructor %>(bitgo);
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return '<%= testnetSymbol %>';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Testnet <%= coin %>';
  }
}
