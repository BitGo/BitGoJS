import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotImplementedError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class KeyRegistrationBuilder extends TransactionBuilder {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  protected buildImplementation(): Promise<Transaction> {
    throw new NotImplementedError('buildImplementation not implemented');
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: unknown): Transaction {
    throw new NotImplementedError('fromImplementation not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('signImplementation not implemented');
  }
}
