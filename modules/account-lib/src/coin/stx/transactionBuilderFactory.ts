import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BufferReader, deserializeTransaction, PayloadType } from '@stacks/transactions';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { ParseTransactionError, InvalidTransactionError, NotImplementedError } from '../baseCoin/errors';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { ContractBuilder } from './contractBuilder';
import { Utils } from '.';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    this.validateRawTransaction(raw);
    try {
      const tx = this.parseTransaction(raw);
      switch (tx.stxTransaction.payload.payloadType) {
        case PayloadType.TokenTransfer:
          return this.getTransferBuilder(tx);
        case PayloadType.ContractCall:
          return this.getContractBuilder(tx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      console.error(e);
      throw new ParseTransactionError('There was an error parsing the raw transaction');
    }
  }

  private parseTransaction(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    const stackstransaction = deserializeTransaction(
      BufferReader.fromBuffer(Buffer.from(Utils.removeHexPrefix(rawTransaction), 'hex')),
    );
    tx.stxTransaction = stackstransaction;
    return tx;
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction) {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(new TransferBuilder(this._coinConfig), tx);
  }

  getContractBuilder(tx?: Transaction): ContractBuilder {
    return TransactionBuilderFactory.initializeBuilder(new ContractBuilder(this._coinConfig), tx);
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private static initializeBuilder<T extends TransactionBuilder>(builder: T, tx: Transaction | undefined): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: unknown): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    if (!Utils.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }
}
