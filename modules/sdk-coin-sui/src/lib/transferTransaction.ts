import {
  BaseKey,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import {
  PayTx,
  SuiObjectRef,
  SuiTransaction,
  SuiTransactionType,
  TransactionExplanation,
  TxData,
  TxDetails,
} from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { UNAVAILABLE_TEXT } from './constants';
import { Buffer } from 'buffer';
import { Transaction } from './transaction';

export class TransferTransaction extends Transaction<PayTx> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction<PayTx> {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: SuiTransaction<PayTx>): void {
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
    return this.suiTransaction.tx.coins;
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
    let txDetails: TxDetails;

    switch (tx.type) {
      case SuiTransactionType.Pay:
        txDetails = {
          Pay: {
            coins: tx.tx.coins,
            recipients: tx.tx.recipients,
            amounts: tx.tx.amounts,
          },
        };
        break;
      case SuiTransactionType.PaySui:
        txDetails = {
          PaySui: {
            coins: tx.tx.coins,
            recipients: tx.tx.recipients,
            amounts: tx.tx.amounts,
          },
        };
        break;
      case SuiTransactionType.PayAllSui:
        txDetails = {
          PayAllSui: {
            coins: tx.tx.coins,
            recipient: tx.tx.recipients[0],
          },
        };
        break;
      default:
        throw new InvalidTransactionError('SuiTransactionType not supported');
    }

    return {
      id: this._id,
      kind: { Single: txDetails },
      sender: tx.sender,
      gasData: tx.gasData,
    };
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
    const payTx = tx.tx;
    const recipients = payTx.recipients;
    const amounts = payTx.amounts;
    if (tx.type !== SuiTransactionType.PayAllSui && recipients.length !== amounts.length) {
      throw new Error(
        `The length of recipients ${recipients.length} does not equal to the length of amounts ${amounts.length}`
      );
    }

    const isEmptyAmount = amounts.length === 0;
    this._outputs = recipients.map((recipient, index) => ({
      address: recipient,
      value: isEmptyAmount ? '' : amounts[index].toString(),
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
      this._suiTransaction = Transaction.deserializeSuiTransaction(rawTransaction) as SuiTransaction<PayTx>;
      this._type = TransactionType.Send;
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
        tx = {
          Pay: {
            coins: suiTx.tx.coins,
            recipients: suiTx.tx.recipients,
            amounts: suiTx.tx.amounts,
          },
        };
        break;
      case SuiTransactionType.PaySui:
        tx = {
          PaySui: {
            coins: suiTx.tx.coins,
            recipients: suiTx.tx.recipients,
            amounts: suiTx.tx.amounts,
          },
        };
        break;
      case SuiTransactionType.PayAllSui:
        tx = {
          PayAllSui: {
            coins: suiTx.tx.coins,
            recipient: suiTx.tx.recipients[0],
          },
        };
        break;
      default:
        throw new InvalidTransactionError('SuiTransactionType not supported');
    }

    return {
      kind: { Single: tx },
      sender: suiTx.sender,
      gasData: suiTx.gasData,
    };
  }

  /**
   * Returns a complete explanation for a transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const recipients = this.suiTransaction.tx.recipients;
    const amounts = this.suiTransaction.tx.amounts;

    const outputs: TransactionRecipient[] = recipients.map((recipient, index) => ({
      address: recipient,
      amount: amounts.length === 0 ? '' : amounts[index].toString(),
    }));
    const outputAmount = amounts.reduce((accumulator, current) => accumulator + current, 0);

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }
}
