import { PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AllocationRequest, CantonPrepareCommandResponse } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';

/**
 * Builder for an AllocationRequest txRequest — an internal, non-signable transaction
 * that surfaces the DvP trade leg details to the allocating party. The party reviews
 * this request and then submits a separate AllocationAllocate to lock their asset.
 *
 * setTransaction and addSignature are intentionally not implemented because this
 * transaction type is never signed or broadcast directly.
 */
export class AllocationRequestBuilder extends TransactionBuilder {
  private _updateId: string;
  private _operatorId: string;
  private _contractId: string;
  private _tradeId: string;
  private _transferLegId: string;
  private _senderPartyId: string;
  private _receiverPartyId: string;
  private _amount: number;
  private _token: string;
  private _receiveToken: string;
  private _receiveAmount: number;
  private _allocateBefore: string;
  private _settleBefore: string;
  private _comment?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.AllocationRequest;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.AllocationRequest;
  }

  setTransaction(transaction: CantonPrepareCommandResponse): void {
    throw new Error('Not implemented!');
  }

  /** @inheritDoc */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    throw new Error('Not implemented!');
  }

  /**
   * Sets the ledger update id of the AllocationRequest event.
   * Also sets the transaction id.
   * @param id - ledger update id (txHash)
   */
  updateId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('updateId must be a non-empty string');
    }
    this._updateId = id.trim();
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the operator party id (settlement executor).
   * @param id - operator party id
   */
  operatorId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('operatorId must be a non-empty string');
    }
    this._operatorId = id.trim();
    return this;
  }

  /**
   * Sets the settlement batch contract id.
   * @param id - settlement batch contract id
   */
  contractId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('contractId must be a non-empty string');
    }
    this._contractId = id.trim();
    return this;
  }

  /**
   * Sets the trade identifier.
   * @param id - trade id
   */
  tradeId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('tradeId must be a non-empty string');
    }
    this._tradeId = id.trim();
    return this;
  }

  /**
   * Sets the specific leg id being allocated (e.g. `${tradeId}-security-leg`).
   * @param id - transfer leg id
   */
  transferLegId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('transferLegId must be a non-empty string');
    }
    this._transferLegId = id.trim();
    return this;
  }

  /**
   * Sets the party performing this allocation (sender of this leg).
   * @param id - sender party id
   */
  senderPartyId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('senderPartyId must be a non-empty string');
    }
    this._senderPartyId = id.trim();
    return this;
  }

  /**
   * Sets the counterparty receiving the allocated asset.
   * @param id - receiver party id
   */
  receiverPartyId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('receiverPartyId must be a non-empty string');
    }
    this._receiverPartyId = id.trim();
    return this;
  }

  /**
   * Sets the quantity to allocate.
   * @param amount - allocation amount
   */
  amount(amount: number): this {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('amount must be a positive number');
    }
    this._amount = amount;
    return this;
  }

  /**
   * Sets the BitGo token identifier for the asset being allocated.
   * @param token - token identifier
   */
  token(token: string): this {
    if (!token || !token.trim()) {
      throw new Error('token must be a non-empty string');
    }
    this._token = token.trim();
    return this;
  }

  /**
   * Sets the BitGo token identifier the allocating party will receive on settlement.
   * @param token - receive token identifier
   */
  receiveToken(token: string): this {
    if (!token || !token.trim()) {
      throw new Error('receiveToken must be a non-empty string');
    }
    this._receiveToken = token.trim();
    return this;
  }

  /**
   * Sets the quantity the allocating party will receive on settlement.
   * @param amount - receive amount
   */
  receiveAmount(amount: number): this {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('receiveAmount must be a positive number');
    }
    this._receiveAmount = amount;
    return this;
  }

  /**
   * Sets the ISO 8601 deadline by which allocation must be submitted.
   * @param deadline - allocate-before timestamp
   */
  allocateBefore(deadline: string): this {
    if (!deadline || !deadline.trim()) {
      throw new Error('allocateBefore must be a non-empty string');
    }
    this._allocateBefore = deadline.trim();
    return this;
  }

  /**
   * Sets the ISO 8601 deadline by which settlement must complete.
   * @param deadline - settle-before timestamp
   */
  settleBefore(deadline: string): this {
    if (!deadline || !deadline.trim()) {
      throw new Error('settleBefore must be a non-empty string');
    }
    this._settleBefore = deadline.trim();
    return this;
  }

  /**
   * Sets an optional free-form comment.
   * @param comment - comment string
   */
  comment(comment: string): this {
    this._comment = comment;
    return this;
  }

  /**
   * Builds and returns the AllocationRequest object from the builder's internal state.
   *
   * @returns {AllocationRequest} - A fully constructed and validated request object.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): AllocationRequest {
    this.validate();
    const result: AllocationRequest = {
      updateId: this._updateId,
      operatorId: this._operatorId,
      contractId: this._contractId,
      tradeId: this._tradeId,
      transferLegId: this._transferLegId,
      senderPartyId: this._senderPartyId,
      receiverPartyId: this._receiverPartyId,
      amount: this._amount,
      token: this._token,
      receiveToken: this._receiveToken,
      receiveAmount: this._receiveAmount,
      allocateBefore: this._allocateBefore,
      settleBefore: this._settleBefore,
    };
    if (this._comment !== undefined) {
      result.comment = this._comment;
    }
    return result;
  }

  private validate(): void {
    if (!this._updateId) throw new Error('updateId is missing');
    if (!this._operatorId) throw new Error('operatorId is missing');
    if (!this._contractId) throw new Error('contractId is missing');
    if (!this._tradeId) throw new Error('tradeId is missing');
    if (!this._transferLegId) throw new Error('transferLegId is missing');
    if (!this._senderPartyId) throw new Error('senderPartyId is missing');
    if (!this._receiverPartyId) throw new Error('receiverPartyId is missing');
    if (this._amount === undefined || this._amount === null) throw new Error('amount is missing');
    if (!this._token) throw new Error('token is missing');
    if (!this._receiveToken) throw new Error('receiveToken is missing');
    if (this._receiveAmount === undefined || this._receiveAmount === null) throw new Error('receiveAmount is missing');
    if (!this._allocateBefore) throw new Error('allocateBefore is missing');
    if (!this._settleBefore) throw new Error('settleBefore is missing');
  }
}
