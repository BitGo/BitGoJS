import {
  BaseKey,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { SuiTransaction, TransactionExplanation, TransferProgrammableTransaction, TxData } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { MAX_GAS_OBJECTS, SUI_ADDRESS_LENGTH, UNAVAILABLE_TEXT } from './constants';
import { Buffer } from 'buffer';
import { Transaction } from './transaction';
import { CallArg, SuiObjectRef, normalizeSuiAddress } from './mystenlab/types';
import utils from './utils';
import { builder, Inputs, TransactionBlockInput } from './mystenlab/builder';
import { BCS } from '@mysten/bcs';

export class TransferTransaction extends Transaction<TransferProgrammableTransaction> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction<TransferProgrammableTransaction> {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: SuiTransaction<TransferProgrammableTransaction>): void {
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
    return utils.normalizeCoins(this.suiTransaction.tx.inputs);
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
    return {
      id: this._id,
      sender: tx.sender,
      kind: { ProgrammableTransaction: tx.tx },
      gasData: tx.gasData,
      expiration: { None: null },
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

    const recipients = utils.getRecipients(this._suiTransaction);
    const totalAmount = recipients.reduce((accumulator, current) => accumulator + Number(current.amount), 0);
    this._outputs = recipients.map((recipient, index) => ({
      address: recipient.address,
      value: recipient.amount,
      coin: this._coinConfig.name,
    }));
    this._inputs = [
      {
        address: this.suiTransaction.sender,
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
      this._suiTransaction = Transaction.deserializeSuiTransaction(
        rawTransaction
      ) as SuiTransaction<TransferProgrammableTransaction>;
      this._type = TransactionType.Send;
      this._id = this._suiTransaction.id;
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
    const inputs: CallArg[] | TransactionBlockInput[] = this._suiTransaction.tx.inputs.map((input) => {
      if (input.hasOwnProperty('Object')) {
        return input;
      }
      if (input.hasOwnProperty('Pure')) {
        if (input.Pure.length === SUI_ADDRESS_LENGTH) {
          const address = normalizeSuiAddress(
            builder.de(BCS.ADDRESS, Buffer.from(input.Pure).toString('base64'), 'base64')
          );
          return Inputs.Pure(address, BCS.ADDRESS);
        } else {
          const amount = builder.de(BCS.U64, Buffer.from(input.Pure).toString('base64'), 'base64');
          return Inputs.Pure(amount, BCS.U64);
        }
      }
      if (input.kind === 'Input' && (input.value.hasOwnProperty('Object') || input.value.hasOwnProperty('Pure'))) {
        return input.value;
      }
      return Inputs.Pure(input.value, input.type === 'pure' ? BCS.U64 : BCS.ADDRESS);
    });

    const programmableTx = {
      inputs,
      transactions: this._suiTransaction.tx.transactions,
    } as TransferProgrammableTransaction;

    return {
      sender: this._suiTransaction.sender,
      expiration: { None: null },
      gasData: {
        ...this._suiTransaction.gasData,
        payment: this._suiTransaction.gasData.payment.slice(0, MAX_GAS_OBJECTS - 1),
      },
      kind: {
        ProgrammableTransaction: programmableTx,
      },
    };
  }

  /**
   * Returns a complete explanation for a transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const recipients = utils.getRecipients(this.suiTransaction);
    const outputs: TransactionRecipient[] = recipients.map((recipient) => recipient);
    const outputAmount = recipients.reduce((accumulator, current) => accumulator + Number(current.amount), 0);

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }
}
