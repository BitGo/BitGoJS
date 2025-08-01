import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Recipient,
  Signature,
  TransactionType,
} from '@bitgo/sdk-core';
import assert from 'assert';
import { Transaction } from './transaction';
import utils from './utils';
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { GasData, SuiProgrammableTransaction, SuiTransactionType } from './iface';
import { DUMMY_SUI_GAS_PRICE } from './constants';
import { KeyPair } from './keyPair';
import { SuiObjectRef } from './mystenlab/types';

export abstract class TransactionBuilder<T = SuiProgrammableTransaction> extends BaseTransactionBuilder {
  protected _transaction: Transaction<T>;
  protected _signatures: Signature[] = [];
  protected _signer: KeyPair;

  protected _type: SuiTransactionType;
  protected _sender: string;
  protected _gasData: GasData;

  protected constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  // get and set region
  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected get transaction(): Transaction<T> {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction<T>) {
    this._transaction = transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction<T> {
    const signer = new KeyPair({ prv: key.key });
    this._signer = signer;
    const signable = this.transaction.signablePayload;
    const signature = signer.signMessageinUint8Array(signable);
    const signatureBuffer = Buffer.from(signature);
    this.transaction.addSignature({ pub: signer.getKeys().pub }, signatureBuffer);
    this.transaction.setSerializedSig({ pub: signer.getKeys().pub }, signatureBuffer);
    return this.transaction;
  }

  /**
   * Signs the transaction as a fee payer.
   *
   * @param {BaseKey} key - The private key to sign the transaction with.
   * @returns {Transaction<T>} - The signed transaction.
   */
  signFeePayer(key: BaseKey): Transaction<T> {
    this.validateKey(key);

    // Check if gasData exists and has a sponsor
    if (!this._gasData?.sponsor) {
      throw new BuildTransactionError('Transaction must have a fee payer (sponsor) to sign as fee payer');
    }

    const signer = new KeyPair({ prv: key.key });
    const signable = this.transaction.signablePayload;
    const signature = signer.signMessageinUint8Array(signable);
    const signatureBuffer = Buffer.from(signature);
    this.transaction.addFeePayerSignature({ pub: signer.getKeys().pub }, signatureBuffer);

    return this.transaction;
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push({ publicKey, signature });
    this.transaction.addSignature(publicKey, signature);
    this.transaction.setSerializedSig(publicKey, signature);
  }

  /**
   * Sets the sender of this transaction.
   * This account will be responsible for paying transaction fees.
   *
   * @param {string} senderAddress the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  sender(senderAddress: string): this {
    utils.validateAddress(senderAddress, 'sender');
    this._sender = senderAddress;
    return this;
  }

  type(type: SuiTransactionType): this {
    this._type = type;
    return this;
  }

  gasData(gasData: GasData): this {
    this.validateGasData(gasData);
    this._gasData = gasData;
    return this;
  }

  /**
   * Sets the gas sponsor (fee payer) address for this transaction.
   * When specified, the sponsor will be responsible for paying transaction fees.
   *
   * @param {string} sponsorAddress the account that will pay for this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  sponsor(sponsorAddress: string): this {
    if (!utils.isValidAddress(sponsorAddress)) {
      throw new BuildTransactionError('Invalid or missing sponsor, got: ' + sponsorAddress);
    }
    if (!this._gasData) {
      throw new BuildTransactionError('gasData must be set before setting sponsor');
    }

    // Update the gasData with the sponsor
    this._gasData = {
      ...this._gasData,
      sponsor: sponsorAddress,
    };

    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  abstract initBuilder(tx: Transaction<T>): void;

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  validateRecipients(recipients: Recipient[]): void {
    assert(
      recipients && recipients.length > 0,
      new BuildTransactionError('at least one recipient is required before building')
    );
    recipients.forEach((recipient) => {
      utils.validateAddress(recipient.address, 'address');
      assert(utils.isValidAmount(recipient.amount), 'Invalid recipient amount');
    });
  }

  validateGasData(gasData: GasData): void {
    if (!utils.isValidAddress(gasData.owner)) {
      throw new BuildTransactionError('Invalid gas address ' + gasData.owner);
    }

    // Validate sponsor address if present
    if ('sponsor' in gasData && gasData.sponsor !== undefined) {
      if (!utils.isValidAddress(gasData.sponsor)) {
        throw new BuildTransactionError('Invalid sponsor address ' + gasData.sponsor);
      }
    }

    this.validateGasPayment(gasData.payment);
    this.validateGasBudget(gasData.budget);
    this.validateGasPrice(gasData.price);
  }

  validateGasBudget(gasBudget: number): void {
    if (gasBudget <= 0) {
      throw new BuildTransactionError('Invalid gas budget ' + gasBudget);
    }
  }

  validateGasPrice(gasPrice: number): void {
    // TODO: check with Sui on the gas price
    if (gasPrice !== DUMMY_SUI_GAS_PRICE) {
      throw new BuildTransactionError('Invalid gas price ' + gasPrice);
    }
  }

  validateGasPayment(payments: SuiObjectRef[]): void {
    assert(payments && payments.length > 0, new BuildTransactionError('gas payment is required before building'));
    payments.forEach((payment) => {
      this.validateSuiObjectRef(payment, 'payment');
    });
  }

  validateSuiObjectRef(suiObjectRef: SuiObjectRef, field: string): void {
    if (!suiObjectRef.hasOwnProperty('objectId')) {
      throw new BuildTransactionError(`Invalid ${field}, missing objectId`);
    }
    if (!suiObjectRef.hasOwnProperty('version') || !utils.isValidAmount(suiObjectRef.version)) {
      throw new BuildTransactionError(`Invalid ${field}, invalid or missing version`);
    }
    if (!suiObjectRef.hasOwnProperty('digest')) {
      throw new BuildTransactionError(`Invalid ${field}, missing digest`);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    try {
      new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError(`Key validation failed`);
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!utils.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
  // endregion
}
