import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { Transaction } from './transaction';
import { TRANSFER_TRANSACTION_COMMANDS } from './constants';
import utils from './utils';
import { Transaction as IotaTransaction } from '@iota/iota-sdk/transactions';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  public getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  from(rawTx: string | Uint8Array): TransactionBuilder {
    let builder: TransactionBuilder;
    const rawTxBase64 = utils.getBase64String(rawTx);
    const txType: TransactionType = this.identifyTxTypeFromRawTx(rawTxBase64);
    switch (txType) {
      case TransactionType.Send:
        builder = new TransferBuilder(this._coinConfig);
        builder.fromImplementation(rawTxBase64);
        return builder;
    }
    throw new InvalidTransactionError('Unsupported transaction');
  }

  private identifyTxTypeFromRawTx(rawTx: string | Uint8Array): TransactionType {
    const txData = IotaTransaction.from(rawTx).getData();
    if (txData.commands.filter((command) => !TRANSFER_TRANSACTION_COMMANDS.includes(command.$kind)).length === 0) {
      return TransactionType.Send;
    }
    throw new InvalidTransactionError('Unsupported commands in the transaction');
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
