import { BaseTransactionBuilderFactory, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { UdcDeployBuilder } from './udcDeployBuilder';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { StarknetTransactionType } from './iface';
import utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  async from(rawTransaction: string): Promise<TransactionBuilder> {
    const transaction = new Transaction(this._coinConfig);
    await transaction.fromRawTransaction(rawTransaction);
    try {
      switch (transaction.starknetTransactionData.transactionType) {
        case StarknetTransactionType.INVOKE: {
          const calls = transaction.starknetTransactionData.calls || [];
          if (calls.length === 1 && utils.isUdcDeployCall(calls[0])) {
            return this.getUdcDeployBuilder(transaction);
          }
          return this.getTransferBuilder(transaction);
        }
        case StarknetTransactionType.DEPLOY_ACCOUNT:
          return this.getWalletInitializationBuilder(transaction);
        default:
          throw new InvalidTransactionError('Invalid transaction type');
      }
    } catch (e) {
      throw new InvalidTransactionError('Invalid transaction: ' + e.message);
    }
  }

  private static initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  getUdcDeployBuilder(tx?: Transaction): UdcDeployBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new UdcDeployBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }
}
