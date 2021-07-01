import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { Action } from './ifaces';

export class WalletInitializationBuilder extends TransactionBuilder {
  protected actionName(): string {
    throw new Error('Method not implemented.');
  }
  protected actionData(action: Action, data: any): Action {
    throw new NotImplementedError('Method not implemented.');
  }

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
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
