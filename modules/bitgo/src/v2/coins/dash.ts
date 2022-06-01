/**
 * @prettier
 */
import { BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, UtxoNetwork } from './abstractUtxoCoin';
import { BitGo } from '../../bitgo';

export class Dash extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.dash);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Dash(bitgo);
  }

  getChain(): string {
    return 'dash';
  }

  getFamily(): string {
    return 'dash';
  }

  getFullName(): string {
    return 'Dash';
  }

  supportsBlockTarget(): boolean {
    return false;
  }
}
