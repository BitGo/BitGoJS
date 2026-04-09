import { TransactionBuilder } from './transactionBuilder';
import { CustomProgrammableTransaction, SuiTransaction, SuiTransactionType } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CustomTransaction } from './customTransaction';
import { BuildTransactionError, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import assert from 'assert';
import utils from './utils';

export class CustomTransactionBuilder extends TransactionBuilder<CustomProgrammableTransaction> {
  protected _rawTransaction: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new CustomTransaction(_coinConfig);
  }

  protected get transactionType() {
    return TransactionType.CustomTx;
  }

  /**
   * set the raw transaction base64 string
   * @param rawTransaction
   */
  rawTransaction(rawTransaction: string): this {
    this.validateRawTransaction(rawTransaction);
    this._rawTransaction = rawTransaction;
    return this;
  }

  /**
   * @inheritdoc
   */
  protected fromImplementation(rawTransaction: string): Transaction<CustomProgrammableTransaction> {
    const tx = new CustomTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    this.validateTransaction(tx);
    return this.transaction;
  }

  /**
   * @inheritdoc
   */
  protected async buildImplementation(): Promise<Transaction<CustomProgrammableTransaction>> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);

    if (this._signer) {
      this.transaction.sign(this._signer);
    }

    if (this.transaction.signature.length === 0) {
      this._signatures.forEach((signature) => {
        this.transaction.addSignature(signature.publicKey, signature.signature);
      });
    }

    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /**
   * Currently custom tx only allows a combination of 3 types of SUI transactions:
   * 1. SplitCoins
   * 2. TransferObjects
   * 3. MoveCall
   * @inheritdoc
   */
  validateTransaction(transaction: CustomTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
    try {
      this.transaction.suiTransaction.tx.transactions.forEach((tx) => {
        utils.getSuiTransactionType(tx);
      });
    } catch (e) {
      if (e instanceof InvalidTransactionError) {
        throw new BuildTransactionError(e.message);
      }
      throw e;
    }
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   * @param tx
   */
  initBuilder(tx: CustomTransaction): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    this.type(SuiTransactionType.CustomTx);
    const txData = tx.toJson();
    this.sender(txData.sender);
    this.rawTransaction(tx.rawTransaction);
    this.gasData(txData.gasData);
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    assert(this._rawTransaction, new BuildTransactionError('rawTransaction is required before building'));
    this.validateGasData(this._gasData);
  }

  /**
   * Build the SuiTransaction object
   */
  protected buildSuiTransaction(): SuiTransaction<CustomProgrammableTransaction> {
    this.validateTransactionFields();
    return Transaction.deserializeSuiTransaction(this._rawTransaction) as SuiTransaction<CustomProgrammableTransaction>;
  }
}
