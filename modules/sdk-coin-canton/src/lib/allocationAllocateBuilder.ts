import { InvalidTransactionError, PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';
import { CantonAllocationAllocateRequest, CantonPrepareCommandResponse } from './iface';
import utils from './utils';

export class AllocationAllocateBuilder extends TransactionBuilder {
  private _commandId: string;
  private _amount: number;
  private _token: string;
  private _operatorId: string;
  private _contractId: string;
  private _tradeId: string;
  private _transferLegId: string;
  private _allocateBefore: string;
  private _settleBefore: string;
  private _receiverPartyId: string;
  private _senderPartyId: string;
  private _comment?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.AllocationAllocate;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.AllocationAllocate;
  }

  setTransaction(transaction: CantonPrepareCommandResponse): void {
    this.transaction.prepareCommand = transaction;
  }

  /** @inheritDoc */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    if (!this.transaction) {
      throw new InvalidTransactionError('transaction is empty!');
    }
    this._signatures.push({ publicKey, signature });
    const pubKeyBase64 = utils.getBase64FromHex(publicKey.pub);
    this.transaction.signerFingerprint = utils.getAddressFromPublicKey(pubKeyBase64);
    this.transaction.signatures = signature.toString('base64');
  }

  /**
   * Sets the unique command id for the allocation
   * Also sets the _id of the transaction
   *
   * @param id - A uuid
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  commandId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('commandId must be a non-empty string');
    }
    this._commandId = id.trim();
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the allocation amount
   * @param amount - allocation amount
   * @returns The current builder instance for chaining.
   * @throws Error if amount is not positive
   */
  amount(amount: number): this {
    if (!amount || amount < 0) {
      throw new Error('amount must be a positive number');
    }
    this._amount = amount;
    return this;
  }

  /**
   * Sets the token for the allocation
   * @param token - token identifier
   * @returns The current builder instance for chaining.
   * @throws Error if token is empty.
   */
  token(token: string): this {
    if (!token || !token.trim()) {
      throw new Error('token must be a non-empty string');
    }
    this._token = token.trim();
    return this;
  }

  /**
   * Sets the operator party id
   * @param id - operator party id
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  operatorId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('operatorId must be a non-empty string');
    }
    this._operatorId = id.trim();
    return this;
  }

  /**
   * Sets the contract id
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
   * Sets the trade id
   * @param id - trade id
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  tradeId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('tradeId must be a non-empty string');
    }
    this._tradeId = id.trim();
    return this;
  }

  /**
   * Sets the transfer leg id (e.g. `${tradeId}-security-leg` or `${tradeId}-cash-leg`)
   * @param id - transfer leg id
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  transferLegId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('transferLegId must be a non-empty string');
    }
    this._transferLegId = id.trim();
    return this;
  }

  /**
   * Sets the allocate-before deadline (ISO 8601)
   * @param deadline - allocation deadline
   * @returns The current builder instance for chaining.
   * @throws Error if deadline is empty.
   */
  allocateBefore(deadline: string): this {
    if (!deadline || !deadline.trim()) {
      throw new Error('allocateBefore must be a non-empty string');
    }
    this._allocateBefore = deadline.trim();
    return this;
  }

  /**
   * Sets the settle-before deadline (ISO 8601)
   * @param deadline - settlement deadline
   * @returns The current builder instance for chaining.
   * @throws Error if deadline is empty.
   */
  settleBefore(deadline: string): this {
    if (!deadline || !deadline.trim()) {
      throw new Error('settleBefore must be a non-empty string');
    }
    this._settleBefore = deadline.trim();
    return this;
  }

  /**
   * Sets the sender party id
   * @param id - sender party id
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  senderPartyId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('senderPartyId must be a non-empty string');
    }
    this._senderPartyId = id.trim();
    return this;
  }

  /**
   * Sets the receiver party id
   * @param id - receiver party id
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  receiverPartyId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('receiverPartyId must be a non-empty string');
    }
    this._receiverPartyId = id.trim();
    return this;
  }

  /**
   * Sets the optional comment
   * @param comment - free-form comment
   * @returns The current builder instance for chaining.
   */
  comment(comment: string): this {
    this._comment = comment;
    return this;
  }

  /**
   * Builds and returns the CantonAllocationAllocateRequest object from the builder's internal state.
   *
   * @returns {CantonAllocationAllocateRequest} - A fully constructed and validated request object.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): CantonAllocationAllocateRequest {
    this.validate();
    const result: CantonAllocationAllocateRequest = {
      commandId: this._commandId,
      amount: this._amount,
      token: this._token,
      operatorId: this._operatorId,
      contractId: this._contractId,
      tradeId: this._tradeId,
      transferLegId: this._transferLegId,
      allocateBefore: this._allocateBefore,
      settleBefore: this._settleBefore,
      receiverPartyId: this._receiverPartyId,
      senderPartyId: this._senderPartyId,
    };
    if (this._comment !== undefined) {
      result.comment = this._comment;
    }
    return result;
  }

  /**
   * Validates the internal state of the builder before building the request object.
   *
   * @private
   * @throws {Error} If any required field is missing.
   */
  private validate(): void {
    if (!this._commandId) throw new Error('commandId is missing');
    if (!this._amount) throw new Error('amount is missing');
    if (!this._token) throw new Error('token is missing');
    if (!this._operatorId) throw new Error('operatorId is missing');
    if (!this._contractId) throw new Error('contractId is missing');
    if (!this._tradeId) throw new Error('tradeId is missing');
    if (!this._transferLegId) throw new Error('transferLegId is missing');
    if (!this._allocateBefore) throw new Error('allocateBefore is missing');
    if (!this._settleBefore) throw new Error('settleBefore is missing');
    if (!this._receiverPartyId) throw new Error('receiverPartyId is missing');
    if (!this._senderPartyId) throw new Error('senderPartyId is missing');
  }
}
