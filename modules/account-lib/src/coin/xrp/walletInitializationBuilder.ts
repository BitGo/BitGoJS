import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionJSON } from 'ripple-lib';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export class WalletInitializationBuilder extends TransactionBuilder {
  protected buildXRPTxn(): TransactionJSON {
    throw new Error('Method not implemented.');
  }
  protected get transactionType(): TransactionType {
    throw new Error('Method not implemented.');
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
