import * as utxolib from '@bitgo/utxo-lib';

import { BitGo } from '../../bitgo';
import { BaseCoin, VerifyRecoveryTransactionOptions as BaseVerifyRecoveryTransactionOptions } from '../baseCoin';
import { AbstractUtxoCoin, UtxoNetwork } from './abstractUtxoCoin';

export interface VerifyRecoveryTransactionOptions extends BaseVerifyRecoveryTransactionOptions {
  transactionHex: string,
}

export class Btc extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoin);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Btc(bitgo);
  }

  getChain(): string {
    return 'btc';
  }

  getFamily(): string {
    return 'btc';
  }

  getFullName(): string {
    return 'Bitcoin';
  }

  supportsBlockTarget(): boolean {
    return true;
  }
}
