import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionType } from '../baseCoin';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.Send);
    return tx;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    const tx = super.signImplementation(key);
    tx.setTransactionType(TransactionType.Send);
    return tx;
  }
}
