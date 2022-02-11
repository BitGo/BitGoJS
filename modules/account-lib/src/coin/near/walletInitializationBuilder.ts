import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { NotImplementedError } from '../baseCoin/errors';

export class WalletInitializationBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('method not implemented');
  }
}
