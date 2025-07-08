import assert from 'assert';
import { TransactionClause } from '@vechain/sdk-core';
import { getProxyInitcode, getCreateForwarderParamsAndTypes, decodeForwarderCreationData } from '@bitgo/abstract-eth';
import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { setLengthLeft, toBuffer, addHexPrefix } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';

import { TransactionBuilder } from './transactionBuilder';
import { AddressInitializationTransaction } from '../transaction/addressInitializationTransaction';
import { Transaction } from '../transaction/transaction';
import utils from '../utils';

export class AddressInitializationBuilder extends TransactionBuilder {
  /**
   * Creates a new AddressInitializationBuilder instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Initializes the builder with an existing AddressInitializationTransaction.
   *
   * @param {AddressInitializationTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: AddressInitializationTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the address initialization transaction instance.
   *
   * @returns {AddressInitializationTransaction} The address initialization transaction
   */
  get addressInitializationTransaction(): AddressInitializationTransaction {
    return this._transaction as AddressInitializationTransaction;
  }

  /**
   * Gets the transaction type for address initialization.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.AddressInitialization;
  }

  /**
   * Validates the transaction clauses for address initialization.
   * @param {TransactionClause[]} clauses - The transaction clauses to validate.
   * @returns {boolean} - Returns true if the clauses are valid, false otherwise.
   */
  protected isValidTransactionClauses(clauses: TransactionClause[]): boolean {
    try {
      if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
        return false;
      }

      const clause = clauses[0];

      if (!clause.to || !utils.isValidAddress(clause.to)) {
        return false;
      }

      // For address init transactions, value must be exactly '0x0'
      if (clause.value !== 0) {
        return false;
      }

      const { baseAddress, addressCreationSalt, feeAddress } = decodeForwarderCreationData(clause.data);

      if (!utils.isValidAddress(baseAddress as string) || !utils.isValidAddress(feeAddress as string)) {
        return false;
      }

      if (!addressCreationSalt) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sets the base address for this forwarder init tx.
   *
   * @param {string} address - The base address to be set for the forwarder address
   * @returns {AddressInitializationBuilder} This transaction builder
   */
  baseAddress(address: string): this {
    this.validateAddress({ address });
    this.addressInitializationTransaction.baseAddress = address;
    return this;
  }

  /**
   * Sets the fee address for this forwarder init tx.
   *
   * @param {string} address - The fee address to be set for the forwarder address
   * @returns {AddressInitializationBuilder} This transaction builder
   */
  feeAddress(address: string): this {
    this.validateAddress({ address });
    this.addressInitializationTransaction.feeAddress = address;
    return this;
  }

  /**
   * Sets the salt value for the forwarder address creation.
   *
   * @param {string} salt - The salt value to use for address creation
   * @returns {AddressInitializationBuilder} This transaction builder
   */
  salt(salt: string): this {
    this.addressInitializationTransaction.salt = salt;
    return this;
  }

  /**
   * Sets the initialization code for the forwarder contract.
   *
   * @param {string} address - The address to generate proxy init code for
   * @returns {AddressInitializationBuilder} This transaction builder
   */
  initCode(address: string): this {
    this.validateAddress({ address });
    this.addressInitializationTransaction.initCode = getProxyInitcode(address);
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: AddressInitializationTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.contract, 'Contract address is required');
    assert(transaction.baseAddress, 'Base address is required');
    assert(transaction.feeAddress, 'Fee address is required');
    assert(transaction.salt, 'Salt is required');
    assert(transaction.initCode, 'Init code is required');

    this.validateAddress({ address: transaction.contract });
    this.validateAddress({ address: transaction.baseAddress });
    this.validateAddress({ address: transaction.feeAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const transactionData = this.getAddressInitializationData();
    this.transaction.type = this.transactionType;
    this.addressInitializationTransaction.transactionData = transactionData;
    await this.addressInitializationTransaction.build();
    return this.transaction;
  }

  /**
   * Generates the transaction data for address initialization by encoding the createForwarder method call.
   *
   * @private
   * @returns {string} The encoded transaction data as a hex string
   */
  private getAddressInitializationData(): string {
    const saltBuffer = setLengthLeft(toBuffer(this.addressInitializationTransaction.salt), 32);
    const { createForwarderParams, createForwarderTypes } = getCreateForwarderParamsAndTypes(
      this.addressInitializationTransaction.baseAddress,
      saltBuffer,
      this.addressInitializationTransaction.feeAddress
    );
    const method = EthereumAbi.methodID('createForwarder', createForwarderTypes);
    const args = EthereumAbi.rawEncode(createForwarderTypes, createForwarderParams);
    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new AddressInitializationTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);

    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    this.validateTransaction(tx);
    return this.transaction;
  }
}
