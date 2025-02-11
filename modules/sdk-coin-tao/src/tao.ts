import { BaseCoin, BitGoBase, SignTransactionOptions as BaseSignTransactionOptions } from '@bitgo/sdk-core';
import { coins, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Interface, SubstrateCoin } from '@bitgo/abstract-substrate';
import { TransactionBuilderFactory } from './lib';

export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  transaction: Interface.TxData;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
}

export class Tao extends SubstrateCoin {
  readonly staticsCoin?: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }
    this.staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tao(bitgo, staticsCoin);
  }

  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  getMaxValidityDurationBlocks(): number {
    return 2400;
  }
}
