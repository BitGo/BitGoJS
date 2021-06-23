import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { EosTransactionBuilder } from './eosTransactionBuilder';
import { Transaction } from './transaction';
import { StakeActionBuilder } from './StakeActionBuilder';
import { BuyRamBytesActionBuilder } from './BuyRamBytesActionBuilder';
import { NewAccountActionBuilder } from './NewAccountActionBuilder';


export class WalletInitializationBuilder extends EosTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.actionBuilders = [];
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    return super.buildImplementation();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    super.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);
  }
}
