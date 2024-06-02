import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, Recipient, TransactionType } from '@bitgo/sdk-core';
import { SuiTransaction, SuiTransactionType, TransferProgrammableTransaction } from './iface';
import { Transaction } from './transaction';
import { TransferTransaction } from './transferTransaction';
import assert from 'assert';
import {
  Inputs,
  Transactions as TransactionsConstructor,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
} from './mystenlab/builder';
import utils from './utils';
import { MAX_COMMAND_ARGS, MAX_GAS_OBJECTS } from './constants';

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
  sign(key: BaseKey): void {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    super.sign(key);
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
    this.gasData({
      ...txData.gasData,
      payment: this.getInputGasPaymentObjectsFromTxData(txData),
    });

    const recipients = utils.getRecipients(tx.suiTransaction);
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
    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();

    // number of objects passed as gas payment should be strictly less than `MAX_GAS_OBJECTS`. When the transaction
    // requires a larger number of inputs we use the merge command to merge the rest of the objects into the gasCoin
    if (this._gasData.payment.length >= MAX_GAS_OBJECTS) {
      const gasPaymentObjects = this._gasData.payment
        .slice(MAX_GAS_OBJECTS - 1)
        .map((object) => Inputs.ObjectRef(object));

      // limit for total number of `args: CallArg[]` for a single command is MAX_COMMAND_ARGS so the max length of
      // `sources[]` for a `mergeCoins(destination, sources[])` command is MAX_COMMAND_ARGS - 1 (1 used up for
      // `destination`). We need to create a total of `gasPaymentObjects/(MAX_COMMAND_ARGS - 1)` merge commands to
      // merge all the objects
      while (gasPaymentObjects.length > 0) {
        programmableTxBuilder.mergeCoins(
          programmableTxBuilder.gas,
          gasPaymentObjects.splice(0, MAX_COMMAND_ARGS - 1).map((object) => programmableTxBuilder.object(object))
        );
      }
    }

    this._recipients.forEach((recipient) => {
      const coin = programmableTxBuilder.add(
        TransactionsConstructor.SplitCoins(programmableTxBuilder.gas, [
          programmableTxBuilder.pure(Number(recipient.amount)),
        ])
      );
      programmableTxBuilder.add(
        TransactionsConstructor.TransferObjects([coin], programmableTxBuilder.object(recipient.address))
      );
    });
    const txData = programmableTxBuilder.blockData;
    return {
      type: this._type,
      sender: this._sender,
      tx: {
        inputs: [...txData.inputs],
        transactions: [...txData.transactions],
      },
      gasData: {
        ...this._gasData,
        payment: this._gasData.payment.slice(0, MAX_GAS_OBJECTS - 1),
      },
    };
  }
}
