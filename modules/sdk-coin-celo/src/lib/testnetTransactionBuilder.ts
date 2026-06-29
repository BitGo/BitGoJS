import * as ethUtil from 'ethereumjs-util';
import { Transaction } from '@bitgo/abstract-eth';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';

export class TestnetTransactionBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig, this._common);
  }

  /**
   * Get the final v value. Final v is described in EIP-155.
   *
   * @protected for internal use when the enableFinalVField flag is true.
   */
  protected getFinalV(): string {
    return ethUtil.addHexPrefix(this._common.chainIdBN().muln(2).addn(35).toString(16));
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    let tx: Transaction;
    if (/^0x?[0-9a-f]{1,}$/.test(rawTransaction.toLowerCase())) {
      tx = Transaction.fromSerialized(this._coinConfig, this._common, rawTransaction);
      this.loadBuilderInput(tx.toJson());
    } else {
      const txData = JSON.parse(rawTransaction);
      tx = new Transaction(this._coinConfig, txData);
    }
    return tx;
  }
}
