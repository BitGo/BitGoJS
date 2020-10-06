import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { BaseTransactionBuilderFactory } from "../baseCoin";
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { isValidRawTransactionFormat } from './utils';
import { InvalidTransactionError, ParseTransactionError } from '../baseCoin/errors';
import { ContractType } from './enum';




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
  public from(raw: any) {
    this.validateRawTransaction(raw);
    const tx = this.parseTransaction(raw);
    const txContractType = tx.toJson().raw_data.contractType;
    switch (txContractType) {
      case ContractType.Transfer:
        return this.getTransferBuilder(tx);
      default:
        throw new InvalidTransactionError('Invalid transaction ' + txContractType);
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {any} rawTransaction - Transaction in any format
   */
  private validateRawTransaction(rawTransaction: any) {
    if (!isValidRawTransactionFormat(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /**
   * Returns a transaction instance from the encoded value
   *
   * @param {any} rawTransaction - encoded transaction
   * @returns {Transaction} the parsed transaction instance
   */
  private parseTransaction(rawTransaction: any): Transaction {
    if (typeof rawTransaction === 'string') {
      const transaction = JSON.parse(rawTransaction);
      return new Transaction(this._coinConfig, transaction);
    }
    return new Transaction(this._coinConfig, rawTransaction);
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