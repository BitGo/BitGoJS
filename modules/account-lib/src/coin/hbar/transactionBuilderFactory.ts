import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { InvalidTransactionError } from '../baseCoin/errors';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { toUint8Array } from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return this.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  from(raw: Uint8Array | string): TransactionBuilder {
    const tx = this.parseTransaction(raw);
    switch (tx.txBody.data) {
      case 'cryptoTransfer':
        return this.getTransferBuilder(tx);
      case 'cryptoCreateAccount':
        return this.getWalletInitializationBuilder(tx);
      default:
        throw new InvalidTransactionError('Invalid transaction');
    }
  }

  private initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T) {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  private parseTransaction(rawTransaction: Uint8Array | string): Transaction {
    const tx = new Transaction(this._coinConfig);
    let buffer;
    if (typeof rawTransaction === 'string') {
      buffer = toUint8Array(rawTransaction);
    } else {
      buffer = rawTransaction;
    }
    tx.bodyBytes(buffer);
    return tx;
  }
}
