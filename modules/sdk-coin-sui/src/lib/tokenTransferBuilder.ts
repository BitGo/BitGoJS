import assert from 'assert';
import { TransactionType, Recipient, BuildTransactionError, BaseKey } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { SuiTransaction, SuiTransactionType, TokenTransferProgrammableTransaction } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TokenTransferTransaction } from './tokenTransferTransaction';
import { SuiObjectRef } from './mystenlab/types';
import utils from './utils';
import {
  Inputs,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
  TransactionArgument,
} from './mystenlab/builder';

export class TokenTransferBuilder extends TransactionBuilder<TokenTransferProgrammableTransaction> {
  protected _recipients: Recipient[];
  protected _inputObjects: SuiObjectRef[];
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TokenTransferTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /** @inheritdoc */
  validateTransaction(transaction: TokenTransferTransaction): void {
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
  protected fromImplementation(rawTransaction: string): Transaction<TokenTransferProgrammableTransaction> {
    const tx = new TokenTransferTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<TokenTransferProgrammableTransaction>> {
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

  /** @inheritdoc */
  initBuilder(tx: TokenTransferTransaction): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }
    const txData = tx.toJson();
    this.type(SuiTransactionType.TokenTransfer);
    this.sender(txData.sender);
    this.gasData(txData.gasData);
    const recipients = utils.getRecipients(tx.suiTransaction);
    this.send(recipients);
    assert(txData.inputObjects);
    this.inputObjects(txData.inputObjects);
  }

  send(recipients: Recipient[]): this {
    this.validateRecipients(recipients);
    this._recipients = recipients;
    return this;
  }

  inputObjects(inputObject: SuiObjectRef[]): this {
    this.validateInputObjects(inputObject);
    this._inputObjects = inputObject;
    return this;
  }

  /**
   * Validates all fields are defined correctly
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
    this.validateInputObjects(this._inputObjects);
  }

  private validateInputObjects(inputObjects: SuiObjectRef[]): void {
    assert(
      inputObjects && inputObjects.length > 0,
      new BuildTransactionError('input objects required before building')
    );
    inputObjects.forEach((inputObject) => {
      this.validateSuiObjectRef(inputObject, 'input object');
    });
  }

  /**
   * Build SuiTransaction
   *
   * @return {SuiTransaction<TokenTransferProgrammableTransaction>}
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<TokenTransferProgrammableTransaction> {
    this.validateTransactionFields();

    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();

    const inputObjects = this._inputObjects.map((object) => programmableTxBuilder.object(Inputs.ObjectRef(object)));
    const mergedObject = inputObjects.shift() as TransactionArgument;

    if (inputObjects.length > 0) {
      programmableTxBuilder.mergeCoins(mergedObject, inputObjects);
    }

    this._recipients.forEach((recipient) => {
      const splitObject = programmableTxBuilder.splitCoins(mergedObject, [
        programmableTxBuilder.pure(Number(recipient.amount)),
      ]);
      programmableTxBuilder.transferObjects([splitObject], programmableTxBuilder.object(recipient.address));
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
      },
    };
  }
}
