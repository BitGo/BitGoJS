/**
 *  FEDE FILE
 */


import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { BaseTransactionBuilderFactory } from "../baseCoin";
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';




export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  
  /**
   * Constructor
   * @param _coinConfig - coin configuration data
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
      super(_coinConfig);
  }
  
  /** @inheritDoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  public getWalletInitializationBuilder() {
      throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  public from(raw: string | Uint8Array) {
      throw new Error('Method not implemented.');
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