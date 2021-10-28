import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { TransactionType } from '../baseCoin';

export class WalletInitializationBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected buildDotTxn(): UnsignedTransaction {
    throw new NotImplementedError('method not implemented');
  }

  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('method not implemented');
  }
}
