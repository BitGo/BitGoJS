import { InvalidTransactionError, toHex, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionExplanation, TransactionObjectInput, TransferTxData, TxData } from './iface';
import {
  Inputs as IotaInputs,
  TransactionObjectArgument,
  Transaction as IotaTransaction,
} from '@iota/iota-sdk/transactions';
import { fromBase64 } from '@iota/iota-sdk/utils';
import { messageWithIntent as iotaMessageWithIntent } from '@iota/iota-sdk/cryptography';
import { BcsReader } from '@iota/bcs';
import { MAX_INPUT_OBJECTS, MAX_RECIPIENTS, TRANSFER_TRANSACTION_COMMANDS } from './constants';
import utils from './utils';
import BigNumber from 'bignumber.js';

export class TransferTransaction extends Transaction {
  private _recipients: TransactionRecipient[];
  private _paymentObjects?: TransactionObjectInput[];

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.Send;
    this._inputs = [];
    this._outputs = [];
  }

  get recipients(): TransactionRecipient[] {
    return this._recipients;
  }

  set recipients(value: TransactionRecipient[]) {
    this._recipients = value;
    this._rebuildRequired = true;
  }

  get paymentObjects(): TransactionObjectInput[] | undefined {
    return this._paymentObjects;
  }

  set paymentObjects(value: TransactionObjectInput[] | undefined) {
    this._paymentObjects = value;
    this._rebuildRequired = true;
  }

  /**
   * @inheritDoc
   */
  addInputsAndOutputs(): void {
    if (!this._iotaTransaction) {
      return;
    }
    const totalAmount = this.recipients.reduce((accumulator, current) => accumulator + Number(current.amount), 0);
    this._outputs = this.recipients.map((recipient, index) => ({
      address: recipient.address,
      value: recipient.amount.toString(),
      coin: this._coinConfig.name,
    }));
    this._inputs = [
      {
        address: this.sender,
        value: totalAmount.toString(),
        coin: this._coinConfig.name,
      },
    ];
  }

  toJson(): TransferTxData {
    return {
      ...super.toJson(),
      recipients: this.recipients,
      paymentObjects: this.paymentObjects,
    };
  }

  parseFromJSON(txData: TransferTxData): void {
    super.parseFromJSON(txData);
    this.recipients = txData.recipients;
    this.paymentObjects = txData.paymentObjects;
    this.updateIsSimulateTx();
  }

  parseFromBroadcastTx(tx: string | Uint8Array): void {
    const txData = IotaTransaction.from(tx).getData();
    if (txData.commands.filter((command) => !TRANSFER_TRANSACTION_COMMANDS.includes(command.$kind)).length > 0) {
      throw new InvalidTransactionError('Unsupported commands in the transaction');
    }
    super.parseFromBroadcastTx(tx);
    const inputObjects: TransactionObjectInput[] = [];
    const amounts: string[] = [];
    const receivers: string[] = [];
    txData.inputs.forEach((input) => {
      if (input.$kind === 'Object' && 'ImmOrOwnedObject' in input.Object) {
        inputObjects.push(input.Object.ImmOrOwnedObject as TransactionObjectInput);
      }
      if (input.$kind === 'Pure' && 'bytes' in input.Pure) {
        const value = fromBase64(input.Pure.bytes);
        const hexValue = toHex(value);
        if (utils.isValidAddress(hexValue)) {
          receivers.push(hexValue);
        } else {
          amounts.push(new BcsReader(value).read64().toString());
        }
      }
    });
    if (amounts.length !== receivers.length) {
      throw new InvalidTransactionError('count of amounts does not match count of receivers');
    }
    this._paymentObjects = inputObjects;
    this.recipients = [];
    receivers.forEach((recipient, index) => {
      this._recipients.push({
        address: recipient,
        amount: amounts[index],
      });
    });
    this.updateIsSimulateTx();
  }

  protected messageWithIntent(message: Uint8Array): Uint8Array {
    return iotaMessageWithIntent('TransactionData', message);
  }

  protected populateTxInputsAndCommands(): void {
    if (this.paymentObjects) {
      let firstInputObj: TransactionObjectArgument = this._iotaTransaction.object(
        IotaInputs.ObjectRef(this.paymentObjects[0])
      );
      if (this.paymentObjects.length > 1) {
        let idx = 1;
        while (idx < this.paymentObjects.length) {
          [firstInputObj] = this._iotaTransaction.mergeCoins(
            firstInputObj,
            this.paymentObjects
              .slice(idx, idx + MAX_INPUT_OBJECTS)
              .map((input) => this._iotaTransaction.object(IotaInputs.ObjectRef(input)))
          );
          idx += MAX_INPUT_OBJECTS;
        }
      }

      const coins = this._iotaTransaction.splitCoins(
        firstInputObj,
        this._recipients.map((recipient) => recipient.amount)
      );
      this._recipients.forEach((recipient, idx) => {
        this._iotaTransaction.transferObjects([coins[idx]], recipient.address);
      });
    }
  }

  protected validateTxDataImplementation(): void {
    if (!this.recipients || this.recipients?.length === 0) {
      throw new InvalidTransactionError('Transaction recipients are required');
    }

    if (this.recipients.length > MAX_RECIPIENTS) {
      throw new InvalidTransactionError(
        `Recipients count (${this.recipients.length}) exceeds maximum allowed (${MAX_RECIPIENTS})`
      );
    }

    if (!this.paymentObjects || this.paymentObjects?.length === 0) {
      throw new InvalidTransactionError('Payment objects are required');
    }

    // Check for duplicate object IDs in payment objects
    const paymentObjectIds = this.paymentObjects.map((obj) => obj.objectId);
    const uniquePaymentIds = new Set(paymentObjectIds);
    if (uniquePaymentIds.size !== paymentObjectIds.length) {
      throw new InvalidTransactionError('Duplicate object IDs found in payment objects');
    }

    if (this.gasPaymentObjects && this.gasPaymentObjects.length > 0) {
      const gasObjectIds = this.gasPaymentObjects.map((gas) => gas.objectId);

      // Check for duplicate object IDs in gas payment objects
      const uniqueGasIds = new Set(gasObjectIds);
      if (uniqueGasIds.size !== gasObjectIds.length) {
        throw new InvalidTransactionError('Duplicate object IDs found in gas payment objects');
      }

      const duplicates = this.paymentObjects.filter((payment) => gasObjectIds.includes(payment.objectId));
      if (duplicates.length > 0) {
        throw new InvalidTransactionError(
          'Payment objects cannot be the same as gas payment objects: ' + duplicates.map((d) => d.objectId).join(', ')
        );
      }
    }
  }

  /**
   * @inheritDoc
   */
  protected explainTransactionImplementation(
    json: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation {
    const outputs: TransactionRecipient[] = this.recipients.map((recipient) => recipient);
    const outputAmountBN = this.recipients.reduce(
      (accumulator, current) => accumulator.plus(current.amount),
      new BigNumber(0)
    );
    const outputAmount = outputAmountBN.toString();

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }
}
