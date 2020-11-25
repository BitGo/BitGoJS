import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { InvalidTransactionError, ParseTransactionError, NotImplementedError } from '../baseCoin/errors';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
// import { isValidRawTransactionFormat } from './utils';

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
    throw new NotImplementedError('from not implemented');
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    throw new NotImplementedError('initializeBuilder not implemented');
  }

  /**
   * Returns a transaction instance from the encoded value
   *
   * @param {Uint8Array | string} rawTransaction - encoded transaction
   * @returns {Transaction} the parsed transaction instance
   */
  private parseTransaction(rawTransaction: Uint8Array | string): Transaction {
    // we dont know if this this will be implemented yet
    throw new NotImplementedError('parseTransaction not implemented');

  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {any} rawTransaction - Transaction in any format
   */
  private validateRawTransaction(rawTransaction: any) {
    // if (!isValidRawTransactionFormat(rawTransaction)) {
    //   throw new ParseTransactionError('Invalid raw transaction');
    // }
  }
}
