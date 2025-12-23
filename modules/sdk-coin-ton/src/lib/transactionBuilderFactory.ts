import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { SingleNominatorWithdrawBuilder } from './singleNominatorWithdrawBuilder';
import { Transaction } from './transaction';
import { TokenTransferBuilder } from './tokenTransferBuilder';
import { TokenTransaction } from './tokenTransaction';
import { TonWhalesDepositBuilder } from './tonWhalesDepositBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    let builder: TransactionBuilder;
    try {
      const checkTx = new Transaction(this._coinConfig);
      checkTx.fromRawTransaction(raw);

      let tx: Transaction;
      if (checkTx.type === TransactionType.SendToken) {
        // It's a token transaction, so use TokenTransaction for proper parsing
        tx = new TokenTransaction(this._coinConfig);
        tx.fromRawTransaction(raw);
      } else {
        // It's a regular transaction, use the already parsed one
        tx = checkTx;
      }
      switch (tx.type) {
        case TransactionType.Send:
          builder = this.getTransferBuilder();
          break;
        case TransactionType.SingleNominatorWithdraw:
          builder = this.getSingleNominatorWithdrawBuilder();
          break;
        case TransactionType.SendToken:
          builder = this.getTokenTransferBuilder();
          break;
        case TransactionType.TonWhalesDeposit:
          builder = this.getTonWhalesDepositBuilder();
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

  /**
   * Returns a specific builder to create a TON token transfer transaction
   */
  getTokenTransferBuilder(): TokenTransferBuilder {
    return new TokenTransferBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }

  getTonWhalesDepositBuilder(): TonWhalesDepositBuilder {
    return new TonWhalesDepositBuilder(this._coinConfig);
  }
}
