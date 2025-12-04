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
import { MAX_GAS_PAYMENT_OBJECTS, MAX_INPUT_OBJECTS, MAX_RECIPIENTS, TRANSFER_TRANSACTION_COMMANDS } from './constants';
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

  /**
   * Parses a transfer transaction from its broadcast format (base64 or raw bytes).
   * Extracts recipients, amounts, and payment objects from the transaction data.
   */
  parseFromBroadcastTx(tx: string | Uint8Array): void {
    const txData = IotaTransaction.from(tx).getData();
    this.validateTransferCommands(txData);

    super.parseFromBroadcastTx(tx);

    const { inputObjects, amounts, receivers } = this.parseTransactionInputs(txData);
    this.validateAmountsMatchReceivers(amounts, receivers);
    this.assignParsedObjects(inputObjects);
    this.assignRecipients(receivers, amounts);
    this.updateIsSimulateTx();
  }

  /**
   * Validates that the transaction only contains supported transfer commands.
   */
  private validateTransferCommands(txData: ReturnType<IotaTransaction['getData']>): void {
    const hasUnsupportedCommands = txData.commands.some(
      (command) => !TRANSFER_TRANSACTION_COMMANDS.includes(command.$kind)
    );

    if (hasUnsupportedCommands) {
      throw new InvalidTransactionError('Unsupported commands in the transaction');
    }
  }

  /**
   * Parses transaction inputs to extract objects, amounts, and receiver addresses.
   */
  private parseTransactionInputs(txData: ReturnType<IotaTransaction['getData']>): {
    inputObjects: TransactionObjectInput[];
    amounts: string[];
    receivers: string[];
  } {
    const inputObjects: TransactionObjectInput[] = [];
    const amounts: string[] = [];
    const receivers: string[] = [];

    txData.inputs.forEach((input) => {
      if (input.$kind === 'Object' && 'ImmOrOwnedObject' in input.Object) {
        inputObjects.push(input.Object.ImmOrOwnedObject as TransactionObjectInput);
      }

      if (input.$kind === 'Pure' && 'bytes' in input.Pure) {
        const value = fromBase64(input.Pure.bytes);
        const hexValue = '0x' + toHex(value);

        if (utils.isValidAddress(hexValue)) {
          receivers.push(hexValue);
        } else {
          amounts.push(new BcsReader(value).read64().toString());
        }
      }
    });

    return { inputObjects, amounts, receivers };
  }

  /**
   * Validates that the number of amounts matches the number of receivers.
   */
  private validateAmountsMatchReceivers(amounts: string[], receivers: string[]): void {
    if (amounts.length !== receivers.length) {
      throw new InvalidTransactionError('Count of amounts does not match count of receivers');
    }
  }

  /**
   * Assigns parsed input objects to either gas payment objects or payment objects.
   * If no gas objects exist and sender pays own gas, objects become gas objects.
   * Otherwise, they become payment objects.
   */
  private assignParsedObjects(inputObjects: TransactionObjectInput[]): void {
    if (inputObjects.length === 0) {
      return;
    }

    const noGasObjectsExist = !this.gasPaymentObjects || this.gasPaymentObjects.length === 0;
    const senderPaysOwnGas = !this.gasSponsor || this.sender === this.gasSponsor;

    if (noGasObjectsExist && senderPaysOwnGas) {
      this.gasPaymentObjects = inputObjects;
    } else {
      this._paymentObjects = inputObjects;
    }
  }

  /**
   * Creates and assigns recipients from parsed addresses and amounts.
   */
  private assignRecipients(receivers: string[], amounts: string[]): void {
    this._recipients = receivers.map((address, index) => ({
      address,
      amount: amounts[index],
    }));
  }

  protected messageWithIntent(message: Uint8Array): Uint8Array {
    return iotaMessageWithIntent('TransactionData', message);
  }

  /**
   * Populates the IOTA transaction with inputs and commands for the transfer.
   * This determines which objects to use for payment (either payment objects or gas objects),
   * consolidates them into a single coin, and then splits/transfers to recipients.
   */
  protected populateTxInputsAndCommands(): void {
    const sourceCoin = this.getConsolidatedSourceCoin();
    this.splitAndTransferToRecipients(sourceCoin);
  }

  /**
   * Determines which objects to use as the payment source and consolidates them.
   * If payment objects are provided, use those. Otherwise, if the sender is paying
   * their own gas, use the gas objects for payment.
   */
  private getConsolidatedSourceCoin(): TransactionObjectArgument {
    if (this.hasPaymentObjects()) {
      return this.consolidatePaymentObjects();
    }
    return this.consolidateGasObjects();
  }

  /**
   * Checks if payment objects exist and if gas objects should be used instead.
   * Gas objects are used when: no payment objects exist AND sender pays their own gas.
   */
  private hasPaymentObjects(): boolean {
    const hasPaymentObjects = this.paymentObjects && this.paymentObjects.length > 0;
    if (hasPaymentObjects) {
      return true;
    }

    // If no payment objects, only use gas objects if sender pays own gas
    const senderPaysOwnGas = !this.gasSponsor || this.gasSponsor === this.sender;
    return !senderPaysOwnGas;
  }

  /**
   * Consolidates payment objects into a single coin object.
   * If multiple payment objects exist, they are merged in batches.
   */
  private consolidatePaymentObjects(): TransactionObjectArgument {
    if (!this.paymentObjects || this.paymentObjects.length === 0) {
      throw new InvalidTransactionError('Payment objects are required');
    }

    const firstObject = this._iotaTransaction.object(IotaInputs.ObjectRef(this.paymentObjects[0]));

    // Single object doesn't need consolidation
    if (this.paymentObjects.length === 1) {
      return firstObject;
    }

    // Merge remaining objects into the first one
    return this.mergeObjectsInBatches(firstObject, this.paymentObjects.slice(1), MAX_INPUT_OBJECTS);
  }

  /**
   * Consolidates gas payment objects into a single coin object.
   * If the number of gas objects exceeds the maximum, they are merged in batches.
   */
  private consolidateGasObjects(): TransactionObjectArgument {
    if (!this.gasPaymentObjects || this.gasPaymentObjects.length === 0) {
      throw new InvalidTransactionError('Gas payment objects are required');
    }

    const gasObject = this._iotaTransaction.gas;

    // If within the limit, no consolidation needed
    if (this.gasPaymentObjects.length <= MAX_GAS_PAYMENT_OBJECTS) {
      return gasObject;
    }

    // Merge excess gas objects to stay within limits
    return this.mergeObjectsInBatches(gasObject, this.gasPaymentObjects, MAX_INPUT_OBJECTS);
  }

  /**
   * Merges multiple coin objects into a target coin in batches.
   * This is necessary because IOTA has limits on the number of objects per merge command.
   *
   * @param targetCoin - The coin to merge into
   * @param objectsToMerge - Array of objects to merge
   * @param batchSize - Maximum number of objects to merge per batch
   * @returns The consolidated coin object
   */
  private mergeObjectsInBatches(
    targetCoin: TransactionObjectArgument,
    objectsToMerge: TransactionObjectInput[],
    batchSize: number
  ): TransactionObjectArgument {
    let consolidatedCoin = targetCoin;

    for (let startIndex = 0; startIndex < objectsToMerge.length; startIndex += batchSize) {
      const batch = objectsToMerge.slice(startIndex, startIndex + batchSize);
      const batchAsTransactionObjects = batch.map((obj) => this._iotaTransaction.object(IotaInputs.ObjectRef(obj)));

      [consolidatedCoin] = this._iotaTransaction.mergeCoins(consolidatedCoin, batchAsTransactionObjects);
    }

    return consolidatedCoin;
  }

  /**
   * Splits the source coin into the amounts needed for each recipient and transfers them.
   * This creates split coin commands for all recipient amounts, then transfer commands
   * to send each split coin to the corresponding recipient.
   */
  private splitAndTransferToRecipients(sourceCoin: TransactionObjectArgument): void {
    const recipientAmounts = this._recipients.map((recipient) => recipient.amount);
    const splitCoins = this._iotaTransaction.splitCoins(sourceCoin, recipientAmounts);

    this._recipients.forEach((recipient, index) => {
      this._iotaTransaction.transferObjects([splitCoins[index]], recipient.address);
    });
  }

  /**
   * Validates all transfer transaction data before building.
   * Checks recipients, payment objects, and ensures no duplicate object IDs.
   */
  protected validateTxDataImplementation(): void {
    this.validateRecipientsList();
    this.validatePaymentObjectsExist();
    this.validateNoDuplicateObjects();
  }

  /**
   * Validates that recipients exist and don't exceed the maximum allowed.
   */
  private validateRecipientsList(): void {
    if (!this.recipients || this.recipients.length === 0) {
      throw new InvalidTransactionError('Transaction recipients are required');
    }

    if (this.recipients.length > MAX_RECIPIENTS) {
      throw new InvalidTransactionError(
        `Recipients count (${this.recipients.length}) exceeds maximum allowed (${MAX_RECIPIENTS})`
      );
    }
  }

  /**
   * Validates that either payment objects or gas objects exist for funding the transfer.
   * When a gas sponsor is used, payment objects are required.
   * Otherwise, either payment objects or gas objects can be used.
   */
  private validatePaymentObjectsExist(): void {
    const hasPaymentObjects = this.paymentObjects && this.paymentObjects.length > 0;
    if (hasPaymentObjects) {
      return; // Payment objects exist, validation passes
    }

    // No payment objects - check if gas objects can be used instead
    const hasGasSponsor = this.gasSponsor && this.gasSponsor !== this.sender;
    if (hasGasSponsor) {
      throw new InvalidTransactionError('Payment objects are required when using a gas sponsor');
    }

    // No gas sponsor - gas objects must exist
    const hasGasObjects = this.gasPaymentObjects && this.gasPaymentObjects.length > 0;
    if (!hasGasObjects) {
      throw new InvalidTransactionError('Payment or Gas objects are required');
    }
  }

  /**
   * Validates that there are no duplicate object IDs within payment objects,
   * gas payment objects, or between the two groups.
   */
  private validateNoDuplicateObjects(): void {
    const paymentObjectIds = this.paymentObjects?.map((obj) => obj.objectId) ?? [];

    // Check for duplicates within payment objects
    this.checkForDuplicateIds(paymentObjectIds, 'payment objects');

    if (!this.gasPaymentObjects || this.gasPaymentObjects.length === 0) {
      return;
    }

    const gasObjectIds = this.gasPaymentObjects.map((gas) => gas.objectId);

    // Check for duplicates within gas payment objects
    this.checkForDuplicateIds(gasObjectIds, 'gas payment objects');

    // Check for overlaps between payment and gas objects
    const overlappingIds = paymentObjectIds.filter((id) => gasObjectIds.includes(id));
    if (overlappingIds.length > 0) {
      throw new InvalidTransactionError(
        'Payment objects cannot be the same as gas payment objects: ' + overlappingIds.join(', ')
      );
    }
  }

  /**
   * Helper to check for duplicate IDs in an array.
   */
  private checkForDuplicateIds(ids: string[], objectType: string): void {
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      throw new InvalidTransactionError(`Duplicate object IDs found in ${objectType}`);
    }
  }

  /**
   * @inheritDoc
   * Provides a human-readable explanation of the transfer transaction.
   */
  protected explainTransactionImplementation(
    _json: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation {
    const outputs = this.recipients.map((recipient) => recipient);
    const outputAmount = this.calculateTotalOutputAmount();

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }

  /**
   * Calculates the total amount being transferred to all recipients.
   */
  private calculateTotalOutputAmount(): string {
    return this.recipients
      .reduce((accumulator, current) => accumulator.plus(current.amount), new BigNumber(0))
      .toString();
  }
}
