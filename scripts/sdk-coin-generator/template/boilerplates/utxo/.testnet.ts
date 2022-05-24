/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { <%= constructor %> } from './<%= symbol %>';

export class <%= testnetConstructor %> extends <%= constructor %> {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new <%= testnetConstructor %>(bitgo);
  }

  getChain(): string {
    return '<%= testnetSymbol %>';
  }

  getFamily(): string {
    return '<%= testnetSymbol %>';
  }

  getFullName(): string {
    return 'Testnet <%= coin %>';
  }
}
