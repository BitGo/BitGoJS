import {
  CustomProgrammableTransaction,
  SuiTransaction,
  SuiTransactionType,
  TransactionExplanation,
  TxData,
} from './iface';
import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { BaseKey, InvalidTransactionError, Recipient, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { UNAVAILABLE_TEXT } from './constants';

export class CustomTransaction extends Transaction<CustomProgrammableTransaction> {
  private _rawTransaction: string;
  private _recipients: Recipient[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * @inheritdoc
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      utils.isValidRawTransaction(rawTransaction);
      this._suiTransaction = Transaction.deserializeSuiTransaction(
        rawTransaction
      ) as SuiTransaction<CustomProgrammableTransaction>;
      this._suiTransaction.type = SuiTransactionType.CustomTx;
      this._type = TransactionType.CustomTx;
      this._id = this._suiTransaction.id;
      this._rawTransaction = rawTransaction;
      this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  /**
   * @inheritdoc
   */
  get id(): string {
    return this._id || UNAVAILABLE_TEXT;
  }

  /**
   * @inheritdoc
   */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /**
   * @inheritdoc
   */
  toBroadcastFormat(): string {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('empty transaction');
    }
    return this.serialize();
  }

  /**
   * @inheritdoc
   */
  loadInputsAndOutputs(): void {
    if (!this._suiTransaction) {
      return;
    }

    this._recipients = utils.getRecipients(this._suiTransaction);
    this._outputs = this._recipients.map((recipient, index) => ({
      address: recipient.address,
      value: recipient.amount,
      coin: this._coinConfig.name,
    }));
    const totalAmount = this._recipients.reduce((accumulator, current) => accumulator + Number(current.amount), 0);

    this._inputs = [
      {
        address: this.suiTransaction.sender,
        value: totalAmount.toString(),
        coin: this._coinConfig.name,
      },
    ];
  }

  /**
   * Get the raw transaction base64 string
   */
  get rawTransaction(): string {
    return this._rawTransaction;
  }

  /**
   * Get the recipients of the transaction if there is any transfers.
   */
  get recipients(): Recipient[] {
    return this._recipients;
  }

  /**
   * @inheritdoc
   */
  public getTxData(): TxData {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('empty transaction');
    }

    const tx = this._suiTransaction;
    return {
      sender: this._suiTransaction.sender,
      expiration: { None: null },
      gasData: this._suiTransaction.gasData,
      kind: {
        ProgrammableTransaction: tx.tx,
      },
    };
  }

  /**
   * @inheritdoc
   */
  public toJson(): TxData {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('empty transaction');
    }

    const tx = this._suiTransaction;
    return {
      id: tx.id,
      sender: tx.sender,
      expiration: { None: null },
      gasData: tx.gasData,
      kind: {
        ProgrammableTransaction: tx.tx,
      },
    };
  }

  /**
   * @inheritdoc
   */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'];
    const explanationResult: TransactionExplanation = {
      displayOrder,
      id: this.id,
      outputs: [], // placeholder which will be filled in the next step
      outputAmount: '0', // placeholder which will be filled in the next step
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this.suiTransaction.gasData.budget.toString() },
      type: this.type,
    };

    return this.explainCustomTransaction(result, explanationResult);
  }

  /**
   * Returns a complete explanation of the custom transaction
   * @param json
   * @param explanationResult
   */
  private explainCustomTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const recipients = utils.getRecipients(this.suiTransaction);
    const outputs: TransactionRecipient[] = recipients.map((recipient) => recipient);
    const outputAmount = recipients.reduce((accumulator, current) => accumulator + Number(current.amount), 0);
    return {
      ...explanationResult,
      outputs,
      outputAmount,
    };
  }
}
