import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { SuiObjectRef, SuiTransaction, TransactionExplanation, TxData, TxDetails } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { bcs } from './bcs';
import * as sha3 from 'js-sha3';
import { SUI_GAS_PRICE, SuiTransactionType, TYPE_TAG, UNAVAILABLE_TEXT } from './constants';
import { Buffer } from 'buffer';

export class Transaction extends BaseTransaction {
  private _suiTransaction: SuiTransaction;
  private _signature: Signature;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: SuiTransaction): void {
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
    return this.suiTransaction.payTx.coins;
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
            coins: tx.payTx.coins,
            recipients: tx.payTx.recipients,
            amounts: tx.payTx.amounts,
          },
        };
        break;
      case SuiTransactionType.PaySui:
        txDetails = {
          PaySui: {
            coins: tx.payTx.coins,
            recipients: tx.payTx.recipients,
            amounts: tx.payTx.amounts,
          },
        };
        break;
      case SuiTransactionType.PayAllSui:
        txDetails = {
          PayAllSui: {
            coins: tx.payTx.coins,
            recipient: tx.payTx.recipients[0],
            amount: tx.payTx.amounts[0],
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
      gasPayment: tx.gasPayment,
      gasBudget: tx.gasBudget,
      gasPrice: SUI_GAS_PRICE,
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
      fee: { fee: this.suiTransaction.gasBudget.toString() },
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
    const payTx = tx.payTx;
    const recipients = payTx.recipients;
    const amounts = payTx.amounts;
    if (recipients.length !== amounts.length) {
      throw new Error(
        `The length of recipients ${recipients.length} does not equal to the length of amounts ${amounts.length}`
      );
    }

    const outputs: Entry[] = recipients.map((recipient, index) => ({
      address: recipient,
      value: amounts[index].toString(),
      coin: this._coinConfig.name,
    }));

    const totalAmount = amounts.reduce((accumulator, current) => accumulator + current, 0);
    this._inputs = [
      {
        address: tx.sender,
        value: totalAmount.toString(),
        coin: this._coinConfig.name,
      },
    ];
    this._outputs = outputs;
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      utils.isValidRawTransaction(rawTransaction);
      this._suiTransaction = Transaction.deserializeSuiTransaction(rawTransaction);
      this._type = TransactionType.Send;
      this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Helper function for serialize() to get the correct txData with transaction type
   */
  private getTxData(): TxData {
    const suiTx = this._suiTransaction;
    let tx: TxDetails;

    switch (suiTx.type) {
      case SuiTransactionType.Pay:
        tx = {
          Pay: {
            coins: suiTx.payTx.coins,
            recipients: suiTx.payTx.recipients,
            amounts: suiTx.payTx.amounts,
          },
        };
        break;
      case SuiTransactionType.PaySui:
        tx = {
          PaySui: {
            coins: suiTx.payTx.coins,
            recipients: suiTx.payTx.recipients,
            amounts: suiTx.payTx.amounts,
          },
        };
        break;
      case SuiTransactionType.PayAllSui:
        tx = {
          PayAllSui: {
            coins: suiTx.payTx.coins,
            recipient: suiTx.payTx.recipients[0],
            amount: suiTx.payTx.amounts[0],
          },
        };
        break;
      default:
        throw new InvalidTransactionError('SuiTransactionType not supported');
    }

    return {
      kind: { Single: tx },
      gasPayment: suiTx.gasPayment,
      gasPrice: SUI_GAS_PRICE,
      gasBudget: suiTx.gasBudget,
      sender: suiTx.sender,
    };
  }

  serialize(): string {
    const txData = this.getTxData();

    const dataBytes = bcs.ser('TransactionData', txData).toBytes();
    const serialized = new Uint8Array(TYPE_TAG.length + dataBytes.length);
    serialized.set(TYPE_TAG);
    serialized.set(dataBytes, TYPE_TAG.length);
    if (this._signature !== undefined) {
      this._id = Buffer.from(sha3.sha3_256(serialized), 'hex').toString('base64');
    }
    return Buffer.from(serialized).toString('base64');
  }

  static deserializeSuiTransaction(serializedTx: string): SuiTransaction {
    const data = Buffer.from(serializedTx, 'base64');
    const trimmedData = new Uint8Array(data.subarray(TYPE_TAG.length));
    const k = bcs.de('TransactionData', trimmedData);

    let type: SuiTransactionType;
    const txDetails: TxDetails = k.kind.Single;
    if (txDetails.hasOwnProperty('Pay')) {
      type = SuiTransactionType.Pay;
    } else if (txDetails.hasOwnProperty('PaySui')) {
      type = SuiTransactionType.PaySui;
    } else if (txDetails.hasOwnProperty('PayAllSui')) {
      type = SuiTransactionType.PayAllSui;
    } else {
      throw new Error('Transaction type not supported: ' + txDetails);
    }

    const { coins, recipients, amounts } = this.getProperTxDetails(k, type);

    return {
      type,
      sender: utils.normalizeHexId(k.sender),
      payTx: {
        coins,
        recipients,
        amounts,
      },
      gasBudget: k.gasBudget.toNumber(),
      gasPrice: k.gasPrice.toNumber(),
      gasPayment: {
        objectId: utils.normalizeHexId(k.gasPayment.objectId),
        version: k.gasPayment.version.toNumber(),
        digest: k.gasPayment.digest,
      },
    };
  }

  static getProperTxDetails(
    k: any,
    type: SuiTransactionType
  ): { coins: SuiObjectRef[]; recipients: string[]; amounts: number[] } {
    // bcs deserialized number into Big Number and removed '0x' prefix from addresses, needs to convert them back
    let coins;
    let recipients;
    let amounts;

    switch (type) {
      case SuiTransactionType.Pay:
        coins = k.kind.Single.Pay.coins;
        recipients = k.kind.Single.Pay.recipients;
        amounts = k.kind.Single.Pay.amounts;
        break;
      case SuiTransactionType.PaySui:
        coins = k.kind.Single.PaySui.coins;
        recipients = k.kind.Single.PaySui.recipients;
        amounts = k.kind.Single.PaySui.amounts;
        break;
      case SuiTransactionType.PayAllSui:
        coins = k.kind.Single.PayAllSui.coins;
        recipients = [k.kind.Single.PayAllSui.recipient];
        amounts = [k.kind.Single.PayAllSui.amount];
        break;
      default:
        throw new InvalidTransactionError('SuiTransactionType not supported');
    }

    coins = coins.map((coin): SuiObjectRef => {
      return {
        objectId: utils.normalizeHexId(coin.objectId),
        version: coin.version.toNumber(),
        digest: coin.digest,
      };
    }) as SuiObjectRef[];
    recipients = recipients.map((recipient) => utils.normalizeHexId(recipient)) as string[];
    amounts = amounts.map((amount) => amount.toNumber()) as number[];

    return { coins, recipients, amounts };
  }

  /**
   * Returns a complete explanation for a transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const recipients = this.suiTransaction.payTx.recipients;
    const amounts = this.suiTransaction.payTx.amounts;

    const outputs: TransactionRecipient[] = recipients.map((recipient, index) => ({
      address: recipient,
      amount: amounts[index].toString(),
    }));
    const outputAmount = amounts.reduce((accumulator, current) => accumulator + current, 0);

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }
}
