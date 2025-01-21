import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransferTransaction } from './transaction/transferTransaction';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new TransferTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    console.log('temp');
    return TransactionType.Send;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: TransferTransaction): void {
    this._transaction = tx;
  }
}
