import {
  BaseAddress,
  BaseKey,
  BaseTransaction,
  BaseTransactionBuilder,
  BuildTransactionError,
  ParseTransactionError,
  PublicKey,
  TransactionType,
} from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { TransactionObjectInput, GasData } from './iface';
import { toBase64 } from '@iota/iota-sdk/utils';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;

  protected constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this.validateTransaction(tx);
    this.transaction.sender = tx.sender;
    this.transaction.gasPrice = tx.gasPrice;
    this.transaction.gasBudget = tx.gasBudget;
    this.transaction.gasPaymentObjects = tx.gasPaymentObjects;
    this.transaction.gasSponsor = tx.gasSponsor;
  }

  get transactionType(): TransactionType {
    return this.transaction.type;
  }

  /**
   * @inheritdoc
   * */
  get transaction(): Transaction {
    return this._transaction;
  }

  /**
   * @inheritdoc
   * */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Sets the sender of this transaction.
   *
   * @param {string} senderAddress the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  sender(senderAddress: string): this {
    this.validateAddress({ address: senderAddress });
    this.transaction.sender = senderAddress;
    return this;
  }

  /**
   * Sets the gasData for this transaction.
   *
   * @param {string} gasData the gas details for this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  gasData(gasData: GasData): this {
    this.validateGasData(gasData);
    this.transaction.gasPrice = gasData.gasPrice;
    this.transaction.gasBudget = gasData.gasBudget;
    this.transaction.gasPaymentObjects = gasData.gasPaymentObjects as TransactionObjectInput[];
    return this;
  }

  /**
   * Sets the gasSponsor of this transaction.
   *
   * @param {string} sponsorAddress the account that is sponsoring this transaction's gas
   * @returns {TransactionBuilder} This transaction builder
   */
  gasSponsor(sponsorAddress: string): this {
    this.validateAddress({ address: sponsorAddress });
    this.transaction.gasSponsor = sponsorAddress;
    return this;
  }

  addSignature(publicKey: PublicKey, signature: Buffer): void {
    if (!utils.isValidPublicKey(publicKey.pub) || !utils.isValidSignature(toBase64(signature))) {
      throw new BuildTransactionError('Invalid transaction signature');
    }
    this.transaction.addSignature(publicKey, signature);
  }

  addGasSponsorSignature(publicKey: PublicKey, signature: Buffer): void {
    if (!utils.isValidPublicKey(publicKey.pub) || !utils.isValidSignature(toBase64(signature))) {
      throw new BuildTransactionError('Invalid transaction signature');
    }
    this.transaction.addGasSponsorSignature(publicKey, signature);
  }

  validateKey(key: BaseKey): void {
    throw new Error('Method not implemented.');
  }

  /**
   * @inheritdoc
   * */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /**
   * @inheritdoc
   * */
  validateValue(value: BigNumber): void {
    if (value.isNaN()) {
      throw new BuildTransactionError('Invalid amount format');
    } else if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
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

  /**
   * @inheritdoc
   * */
  validateTransaction(transaction?: Transaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    this.validateAddress({ address: transaction.sender });
    this.validateGasData({
      gasBudget: transaction.gasBudget,
      gasPrice: transaction.gasPrice,
      gasPaymentObjects: transaction.gasPaymentObjects,
    });
    if (transaction.gasSponsor) {
      this.validateAddress({ address: transaction.gasSponsor });
    }
  }

  /**
   * @inheritdoc
   * */
  fromImplementation(rawTransaction: string | Uint8Array): Transaction {
    if (!utils.isValidRawTransaction(rawTransaction)) {
      throw new BuildTransactionError('Invalid transaction');
    }
    this.transaction.parseFromBroadcastTx(rawTransaction);
    return this.transaction;
  }

  /**
   * @inheritdoc
   * */
  protected signImplementation(key: BaseKey): BaseTransaction {
    throw new Error('Method not implemented.');
  }

  /**
   * @inheritdoc
   * */
  protected async buildImplementation(): Promise<Transaction> {
    // If gas data is provided, this is not a simulate transaction
    if (this.transaction.gasPrice && this.transaction.gasBudget && this.transaction.gasPaymentObjects) {
      this.transaction.isSimulateTx = false;
    }
    await this.transaction.build();
    this.transaction.addInputsAndOutputs();
    return this.transaction;
  }

  private validateGasData(gasData: GasData): void {
    if (gasData.gasBudget) {
      this.validateValue(new BigNumber(gasData.gasBudget));
    }
    if (gasData.gasPrice) {
      this.validateValue(new BigNumber(gasData.gasPrice));
    }
    if (gasData.gasPaymentObjects && gasData.gasPaymentObjects.length === 0) {
      throw new BuildTransactionError('Gas input objects list is empty');
    }
  }
}
