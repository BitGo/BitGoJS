import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { SingleNominatorWithdrawBuilder } from './singleNominatorWithdrawBuilder';
import { Transaction } from './transaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    let builder: TransactionBuilder;
    const tx = new Transaction(this._coinConfig);
    tx.fromRawTransaction(raw);
    try {
      switch (tx.type) {
        case TransactionType.Send:
          builder = this.getTransferBuilder();
          break;
        case TransactionType.SingleNominatorWithdraw:
          builder = this.getSingleNominatorWithdrawBuilder();
          break;
        default:
          throw new InvalidTransactionError('unsupported transaction');
      }
      builder.from(raw);
      return builder;
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig);
  }

  /**
   * Returns a specific builder to create a TON withdraw transaction
   */
  getSingleNominatorWithdrawBuilder(): SingleNominatorWithdrawBuilder {
    return new SingleNominatorWithdrawBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }
}
