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

/**
 * Base class for IOTA transaction builders.
 * Provides common functionality for building and validating IOTA transactions.
 */
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;

  protected constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Initializes the transaction builder with data from an existing transaction.
   * Copies sender, gas data, and gas sponsor information.
   */
  initBuilder(tx: Transaction): void {
    this.validateTransaction(tx);
    this.copyTransactionData(tx);
  }

  /**
   * Copies transaction data from the source transaction to the builder's transaction.
   */
  private copyTransactionData(tx: Transaction): void {
    this.transaction.sender = tx.sender;
    this.transaction.gasPrice = tx.gasPrice;
    this.transaction.gasBudget = tx.gasBudget;
    this.transaction.gasPaymentObjects = tx.gasPaymentObjects;
    this.transaction.gasSponsor = tx.gasSponsor;
  }

  get transactionType(): TransactionType {
    return this.transaction.type;
  }

  get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Sets the sender address for this transaction.
   * @param senderAddress - The IOTA address that is sending this transaction
   * @returns This transaction builder for method chaining
   */
  sender(senderAddress: string): this {
    this.validateAddress({ address: senderAddress });
    this.transaction.sender = senderAddress;
    return this;
  }

  /**
   * Sets the gas data for this transaction (budget, price, and payment objects).
   * @param gasData - The gas configuration including budget, price, and payment objects
   * @returns This transaction builder for method chaining
   */
  gasData(gasData: GasData): this {
    this.validateGasData(gasData);
    this.setGasDataOnTransaction(gasData);
    return this;
  }

  /**
   * Sets gas data fields on the transaction.
   */
  private setGasDataOnTransaction(gasData: GasData): void {
    this.transaction.gasPrice = gasData.gasPrice;
    this.transaction.gasBudget = gasData.gasBudget;
    this.transaction.gasPaymentObjects = gasData.gasPaymentObjects as TransactionObjectInput[];
  }

  /**
   * Sets the gas sponsor for this transaction.
   * The gas sponsor pays for transaction fees instead of the sender.
   * @param sponsorAddress - The IOTA address sponsoring this transaction's gas fees
   * @returns This transaction builder for method chaining
   */
  gasSponsor(sponsorAddress: string): this {
    this.validateAddress({ address: sponsorAddress });
    this.transaction.gasSponsor = sponsorAddress;
    return this;
  }

  /**
   * Adds a signature from the transaction sender.
   * @param publicKey - The sender's public key
   * @param signature - The signature bytes
   * @throws BuildTransactionError if the signature or public key is invalid
   */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    this.validateSignatureData(publicKey, signature);
    this.transaction.addSignature(publicKey, signature);
  }

  /**
   * Adds a signature from the gas sponsor.
   * @param publicKey - The gas sponsor's public key
   * @param signature - The signature bytes
   * @throws BuildTransactionError if the signature or public key is invalid
   */
  addGasSponsorSignature(publicKey: PublicKey, signature: Buffer): void {
    this.validateSignatureData(publicKey, signature);
    this.transaction.addGasSponsorSignature(publicKey, signature);
  }

  /**
   * Validates that the signature and public key are in valid formats.
   */
  private validateSignatureData(publicKey: PublicKey, signature: Buffer): void {
    if (!utils.isValidPublicKey(publicKey.pub) || !utils.isValidSignature(toBase64(signature))) {
      throw new BuildTransactionError('Invalid transaction signature');
    }
  }

  validateKey(key: BaseKey): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Validates an IOTA address format.
   * @throws BuildTransactionError if address is invalid
   */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /**
   * Validates that a numeric value is valid (not NaN and not negative).
   * @throws BuildTransactionError if value is invalid
   */
  validateValue(value: BigNumber): void {
    if (value.isNaN()) {
      throw new BuildTransactionError('Invalid amount format');
    }
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /**
   * Validates that a raw transaction string is properly formatted.
   * @throws ParseTransactionError if raw transaction is invalid
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!utils.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /**
   * Validates a transaction object has all required fields.
   * @throws Error if transaction is undefined or has invalid data
   */
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
   * Creates a transaction object from a raw transaction string or bytes.
   * @param rawTransaction - Raw transaction in base64 string or Uint8Array format
   * @returns The parsed transaction object
   * @throws BuildTransactionError if raw transaction is invalid
   */
  fromImplementation(rawTransaction: string | Uint8Array): Transaction {
    if (!utils.isValidRawTransaction(rawTransaction)) {
      throw new BuildTransactionError('Invalid transaction');
    }
    this.transaction.parseFromBroadcastTx(rawTransaction);
    return this.transaction;
  }

  /**
   * Sign implementation - not supported for IOTA transactions.
   * IOTA transactions must be signed externally.
   */
  protected signImplementation(key: BaseKey): BaseTransaction {
    throw new Error('Method not implemented.');
  }

  /**
   * Builds the transaction and prepares it for broadcast.
   * Automatically switches from simulate to real transaction mode if gas data is present.
   */
  protected async buildImplementation(): Promise<Transaction> {
    this.updateTransactionMode();
    await this.transaction.build();
    this.transaction.addInputsAndOutputs();
    return this.transaction;
  }

  /**
   * Updates the transaction mode based on gas data availability.
   * Switches to real transaction mode if all gas data is provided.
   */
  private updateTransactionMode(): void {
    const hasCompleteGasData =
      this.transaction.gasPrice && this.transaction.gasBudget && this.transaction.gasPaymentObjects;

    if (hasCompleteGasData) {
      this.transaction.isSimulateTx = false;
    }
  }

  /**
   * Validates gas data values and presence.
   * @throws BuildTransactionError if gas data is invalid
   */
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
