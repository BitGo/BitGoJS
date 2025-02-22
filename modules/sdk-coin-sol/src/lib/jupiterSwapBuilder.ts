import { TransactionBuilder } from './transactionBuilder';
import { TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

export class JupiterSwapBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.JupiterSwap;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
  }

  protected async buildImplementation(): Promise<Transaction> {
    return await super.buildImplementation();
  }
}
