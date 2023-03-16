import {
  BaseKey,
  InvalidTransactionError,
  NotImplementedError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { PayTx, BitGoSuiTransaction, SuiTransactionType, TransactionExplanation, TxData, TxDetails } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { UNAVAILABLE_TEXT } from './constants';
import { Buffer } from 'buffer';
import { Transaction } from './transaction';
import { ProgrammableTransaction, SuiObjectRef } from './mystenlab/types';

export class TransferTransaction extends Transaction<ProgrammableTransaction> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): BitGoSuiTransaction<ProgrammableTransaction> {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: BitGoSuiTransaction<ProgrammableTransaction>): void {
    this._suiTransaction = tx;
  }

  /** @inheritDoc **/
  get id(): string {
    return this._id || UNAVAILABLE_TEXT;
  }

  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serialize();
  }

  get suiSignature(): Signature {
    return this._signature;
  }

  getInputCoins(): SuiObjectRef[] {
    throw new NotImplementedError('Not Implemented');
    // return this.suiTransaction.tx.inputs;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._suiTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }

    const tx = this._suiTransaction;
    switch (tx.type) {
      case SuiTransactionType.Pay:
        throw new NotImplementedError('Not Implemented');
      case SuiTransactionType.PaySui:
        throw new NotImplementedError('Not Implemented');
      case SuiTransactionType.PayAllSui:
        throw new NotImplementedError('Not Implemented');
      default:
        throw new InvalidTransactionError('SuiTransactionType not supported');
    }
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'];
    const outputs: TransactionRecipient[] = [];

    const explanationResult: TransactionExplanation = {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount: '0',
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this.suiTransaction.gasData.budget.toString() },
      type: this.type,
    };

    switch (this.type) {
      case TransactionType.Send:
        return this.explainTransferTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  transactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this.suiTransaction) {
      return;
    }

    const tx = this.suiTransaction;
    const recipients = [];
    const amounts = [];
    if (tx.type !== SuiTransactionType.PayAllSui && recipients.length !== amounts.length) {
      throw new Error(
        `The length of recipients ${recipients.length} does not equal to the length of amounts ${amounts.length}`
      );
    }

    const isEmptyAmount = amounts.length === 0;
    this._outputs = recipients.map((recipient, index) => ({
      address: recipient,
      value: isEmptyAmount ? '' : amounts[index],
      coin: this._coinConfig.name,
    }));

    const totalAmount = isEmptyAmount ? '' : amounts.reduce((accumulator, current) => accumulator + current, 0);
    this._inputs = [
      {
        address: tx.sender,
        value: totalAmount.toString(),
        coin: this._coinConfig.name,
      },
    ];
  }

  /**
   * Sets this transaction payload
   *
   * @param {string} rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      utils.isValidRawTransaction(rawTransaction);
      throw new NotImplementedError('Not Implemented');
      // this._suiTransaction = Transaction.deserializeSuiTransaction(rawTransaction) as BitGoSuiTransaction<PayTx>;
      // this._type = TransactionType.Send;
      this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Helper function for serialize() to get the correct txData with transaction type
   *
   * @return {TxData}
   */
  public getTxData(): TxData {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('empty transaction');
    }
    const suiTx = this._suiTransaction;
    let tx: TxDetails;

    switch (suiTx.type) {
      case SuiTransactionType.Pay:
        throw new NotImplementedError('Not Implemented');
      case SuiTransactionType.PaySui:
        throw new NotImplementedError('Not Implemented');
      case SuiTransactionType.PayAllSui:
        throw new NotImplementedError('Not Implemented');
      default:
        throw new InvalidTransactionError('SuiTransactionType not supported');
    }
  }

  /**
   * Returns a complete explanation for a transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const recipients = [];
    const amounts = [];

    const outputs: TransactionRecipient[] = recipients.map((recipient, index) => ({
      address: recipient,
      amount: amounts.length === 0 ? '' : amounts[index],
    }));
    const outputAmount = amounts.reduce((accumulator, current) => accumulator + current, 0);

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }
}
