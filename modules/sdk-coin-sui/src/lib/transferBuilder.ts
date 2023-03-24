import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, Recipient, TransactionType } from '@bitgo/sdk-core';
import { SuiTransaction, SuiTransactionType, TransferProgrammableTransaction } from './iface';
import { Transaction } from './transaction';
import { TransferTransaction } from './transferTransaction';
import assert from 'assert';
import { Commands, Transaction as ProgrammingTransactionBuilder } from './mystenlab/builder';
import utils from './utils';

export class TransferBuilder extends TransactionBuilder<TransferProgrammableTransaction> {
  protected _recipients: Recipient[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TransferTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  send(recipients: Recipient[]): this {
    this.validateRecipients(recipients);
    this._recipients = recipients;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction: TransferTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<TransferProgrammableTransaction> {
    const tx = new TransferTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<TransferProgrammableTransaction>> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);

    if (this._signer) {
      this.transaction.sign(this._signer);
    }

    this._signatures.forEach((signature) => {
      this.transaction.addSignature(signature.publicKey, signature.signature);
    });

    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: TransferTransaction): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.Transfer);
    this.sender(txData.sender);
    this.gasData(txData.gasData);

    const recipients = utils.getRecipients(txData.kind.ProgrammableTransaction.inputs);
    this.send(recipients);
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(
      this._recipients && this._recipients.length > 0,
      new BuildTransactionError('at least one recipient is required before building')
    );
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
  }

  /**
   * Build transfer programmable transaction
   *
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<TransferProgrammableTransaction> {
    this.validateTransactionFields();
    const programmableTxBuilder = new ProgrammingTransactionBuilder();
    this._recipients.forEach((recipient) => {
      const coin = programmableTxBuilder.add(
        Commands.SplitCoins(programmableTxBuilder.gas, [programmableTxBuilder.pure(Number(recipient.amount))])
      );
      programmableTxBuilder.add(Commands.TransferObjects([coin], programmableTxBuilder.object(recipient.address)));
    });
    const txData = programmableTxBuilder.transactionData;
    return {
      type: this._type,
      sender: this._sender,
      tx: {
        inputs: [...txData.inputs],
        commands: [...txData.commands],
      },
      gasData: {
        ...this._gasData,
      },
    };
  }
}
