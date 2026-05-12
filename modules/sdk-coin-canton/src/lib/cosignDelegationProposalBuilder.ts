import { PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, CosignDelegationProposal } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';

export class CosignDelegationProposalBuilder extends TransactionBuilder {
  private _contractId: string;
  private _operatorId: string;
  private _updateId: string;
  private _packageName?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.CosignDelegationProposal;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.CosignDelegationProposal;
  }

  setTransaction(transaction: CantonPrepareCommandResponse): void {
    throw new Error('Not implemented!');
  }

  /** @inheritDoc */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    throw new Error('Not implemented!');
  }

  /**
   * Sets the contract id of the delegation proposal to cosign
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
   * Sets the optional package name
   * @param name - package name
   * @returns The current builder instance for chaining.
   */
  packageName(name: string): this {
    this._packageName = name;
    return this;
  }

  /**
   * Builds and returns the CosignDelegationProposal object from the builder's internal state.
   *
   * @returns {CosignDelegationProposal} - A fully constructed and validated request object.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): CosignDelegationProposal {
    this.validate();

    const result: CosignDelegationProposal = {
      contractId: this._contractId,
      operatorId: this._operatorId,
      updateId: this._updateId,
    };
    if (this._packageName !== undefined) {
      result.packageName = this._packageName;
    }
    return result;
  }

  /**
   * Validates the internal state of the builder before building the request object.
   *
   * @private
   * @throws {Error} If any required field is missing or invalid.
   */
  private validate(): void {
    if (!this._contractId) throw new Error('contractId is missing');
    if (!this._operatorId) throw new Error('operatorId is missing');
    if (!this._updateId) throw new Error('updateId is missing');
  }
}
