import { PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, TransferAcknowledge } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';

export class TransferAcknowledgeBuilder extends TransactionBuilder {
  private _contractId: string;
  private _senderPartyId: string;
  private _amount: number;
  private _updateId: string;
  private _expiryEpoch: number;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.TransferAcknowledge;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.TransferAcknowledge;
  }

  setTransaction(transaction: CantonPrepareCommandResponse): void {
    throw new Error('Not implemented!');
  }

  /** @inheritDoc */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    throw new Error('Not implemented!');
  }

  /**
   * Sets the contract id the receiver needs to accept/reject
   * @param id - canton contract id
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  contractId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('contractId must be a non-empty string');
    }
    this._contractId = id.trim();
    return this;
  }

  /**
   * Sets the sender party id
   * @param id - sender party id (address)
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  senderPartyId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('partyId must be a non-empty string');
    }
    this._senderPartyId = id.trim();
    return this;
  }

  /**
   * Sets the amount to accept or reject
   * @param amount - incoming deposit amount
   * @returns The current builder instance for chaining.
   * @throws Error if amount <= 0
   */
  amount(amount: number): this {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('amount must be positive number');
    }
    this._amount = amount;
    return this;
  }

  /**
   * Sets the incoming txn id (updateId of the ledger update)
   * @param id - ledger update id
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  updateId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('updateId must be a non-empty string');
    }
    this._updateId = id.trim();
    // also set the transaction id
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the deposit txn expiry
   * @param expiry - expiry epoch
   * @returns The current builder instance for chaining.
   * @throws Error if epoch is invalid
   */
  expiryEpoch(expiry: number): this {
    if (isNaN(expiry)) {
      throw new Error('invalid expiry');
    }
    this._expiryEpoch = expiry;
    return this;
  }

  /**
   * Builds and returns the TransferAcknowledge object from the builder's internal state.
   *
   * This method performs validation before constructing the object. If required fields are
   * missing or invalid, it throws an error.
   *
   * @returns {TransferAcknowledge} - A fully constructed and validated request object for transfer acknowledge.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): TransferAcknowledge {
    this.validate();

    return {
      contractId: this._contractId,
      senderPartyId: this._senderPartyId,
      updateId: this._updateId,
      amount: this._amount,
      expiryEpoch: this._expiryEpoch,
    };
  }

  /**
   * Validates the internal state of the builder before building the request object.
   *
   * @private
   * @throws {Error} If any required field is missing or invalid.
   */
  private validate(): void {
    if (!this._contractId) throw new Error('contractId is missing');
    if (!this._updateId) throw new Error('updateId is missing');
    if (!this._senderPartyId) throw new Error('sender partyId is missing');
    if (!this._amount) throw new Error('amount is missing');
    if (!this._expiryEpoch) throw new Error('expiry is missing');
  }
}
