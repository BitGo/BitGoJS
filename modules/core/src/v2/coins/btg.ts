import * as Bluebird from 'bluebird';
import * as utxolib from '@bitgo/utxo-lib';

import * as errors from '../../errors';
import { BitGo } from '../../bitgo';
import { BaseCoin, VerifyRecoveryTransactionOptions } from '../baseCoin';
import { Btc } from './btc';

export class Btg extends Btc {
  constructor(bitgo: BitGo, network?: any) {
    super(bitgo, network || utxolib.networks.bitcoingold);
  }

  static createInstance(bitgo): BaseCoin {
    return new Btg(bitgo);
  }

  getChain(): string {
    return 'btg';
  }

  getFamily(): string {
    return 'btg';
  }

  getFullName(): string {
    return 'Bitcoin Gold';
  }

  supportsBlockTarget(): boolean {
    return false;
  }

  supportsP2shP2wsh(): boolean {
    return true;
  }

  supportsP2wsh(): boolean {
    return true;
  }

  supportsP2tr(): boolean {
    return false;
  }

  verifyRecoveryTransaction(txInfo: VerifyRecoveryTransactionOptions): Bluebird<any> {
    return Bluebird.reject(new errors.MethodNotImplementedError());
  }
}
