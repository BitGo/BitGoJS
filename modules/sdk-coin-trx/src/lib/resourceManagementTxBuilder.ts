import { BaseKey, ExtendTransactionError, BuildTransactionError, SigningError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { ResourceManagementContract } from './iface';
import { Address } from './address';
import { getBase58AddressFromHex, TRANSACTION_MAX_EXPIRATION, getHexAddressFromBase58Address } from './utils';

/**
 * Abstract base class for resource management transaction builders (delegate/undelegate)
 */
export abstract class ResourceManagementTxBuilder extends TransactionBuilder {
  protected _signingKeys: BaseKey[];
  protected _balance: string;
  protected _resource: string;
  protected _receiverAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._signingKeys = [];
    this.transaction = new Transaction(_coinConfig);
  }

  /**
   * Set the balance amount
   *
   * @param amount amount in TRX to delegate/undelegate
   * @returns the builder with the new parameter set
   */
  setBalance(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._balance = amount;
    return this;
  }

  /**
   * Set the receiver address
   *
   * @param address receiver address for the delegate/undelegate operation
   * @returns the builder with the new parameter set
   */
  setReceiverAddress(address: Address): this {
    this.validateAddress(address);
    this._receiverAddress = getHexAddressFromBase58Address(address.address);
    return this;
  }

  /**
   * Set the resource type
   *
   * @param resource resource type to delegate/undelegate
   * @returns the builder with the new parameter set
   */
  setResource(resource: string): this {
    this.validateResource(resource);
    this._resource = resource;
    return this;
  }

  /** @inheritdoc */
  extendValidTo(extensionMs: number): void {
    if (this.transaction.signature && this.transaction.signature.length > 0) {
      throw new ExtendTransactionError('Cannot extend a signed transaction');
    }

    if (extensionMs <= 0) {
      throw new Error('Value cannot be below zero');
    }

    if (extensionMs > TRANSACTION_MAX_EXPIRATION) {
      throw new ExtendTransactionError('The expiration cannot be extended more than one year');
    }

    if (this._expiration) {
      this._expiration = this._expiration + extensionMs;
    } else {
      throw new Error('There is not expiration to extend');
    }
  }

  /**
   * Validates the transaction
   *
   * @param {Transaction} transaction - The transaction to validate
   * @throws {void}
   */
  validateTransaction(transaction: Transaction): void {
    this.validateResourceManagementTransactionFields();
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.createResourceManagementTransaction();

    if (this._signingKeys.length > 0) {
      this.applySignatures();
    }

    if (!this.transaction.id) {
      throw new BuildTransactionError('A valid transaction must have an id');
    }
    return Promise.resolve(this.transaction);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._signingKeys.some((signingKey) => signingKey.key === key.key)) {
      throw new SigningError('Duplicated key');
    }
    this._signingKeys.push(key);

    return this.transaction;
  }

  protected applySignatures(): void {
    if (!this.transaction.inputs) {
      throw new SigningError('Transaction has no inputs');
    }

    this._signingKeys.forEach((key) => this.applySignature(key));
  }

  /**
   * Validates if the transaction is a valid delegate/undelegate transaction
   *
   * @throws {BuildTransactionError} when the transaction is invalid
   */
  protected validateResourceManagementTransactionFields(): void {
    if (!this._balance) {
      throw new BuildTransactionError('Missing parameter: balance');
    }

    if (!this._ownerAddress) {
      throw new BuildTransactionError('Missing parameter: source');
    }

    if (!this._resource) {
      throw new BuildTransactionError('Missing parameter: resource');
    }

    if (!this._receiverAddress) {
      throw new BuildTransactionError('Missing parameter: receiver address');
    }

    if (!this._refBlockBytes || !this._refBlockHash) {
      throw new BuildTransactionError('Missing block reference information');
    }
  }

  /**
   * Initialize the delegate/undelegate contract call specific data
   *
   * @param {ResourceManagementContract} resourceManagementContractCall object with delegate txn data
   */
  protected initResourceManagementContractCall(resourceManagementContractCall: ResourceManagementContract): void {
    const { resource, owner_address, balance, receiver_address } = resourceManagementContractCall.parameter.value;
    if (owner_address) {
      this.source({ address: getBase58AddressFromHex(owner_address) });
    }

    if (resource) {
      this.setResource(resource);
    }

    if (balance !== undefined) {
      this.setBalance(balance.toString());
    }

    if (receiver_address) {
      this.setReceiverAddress({ address: getBase58AddressFromHex(receiver_address) });
    }
  }

  /**
   * Helper method to create the delegate/undelegate resource transaction
   */
  protected abstract createResourceManagementTransaction(): void;

  /**
   * Helper method to get the resource delegate/undelegate transaction raw data hex
   */
  protected abstract getResourceManagementTxRawDataHex(): string;
}
