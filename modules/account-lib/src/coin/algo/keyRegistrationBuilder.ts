import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder } from './transactionBuilder';

export class KeyRegistrationBuilder extends TransactionBuilder {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  protected buildImplementation(): Promise<BaseTransaction> {
    throw new NotImplementedError('buildImplementation not implemented');
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: unknown): BaseTransaction {
    throw new NotImplementedError('fromImplementation not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): BaseTransaction {
    throw new NotImplementedError('signImplementation not implemented');
  }
}
