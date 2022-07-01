/**
 * @prettier
 */
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { <%= constructor %> } from './<%= symbol %>';
import * as utxolib from '@bitgo/utxo-lib';

export class <%= testnetConstructor %> extends <%= constructor %> {
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.<%= coinLowerCase %>Test);
  }

  getChain(): string {
    return '<%= testnetSymbol %>';
  }

  getFullName(): string {
    return 'Testnet <%= coin %>';
  }
}
