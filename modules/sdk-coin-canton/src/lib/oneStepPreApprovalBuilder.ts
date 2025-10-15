import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, OneStepEnablementRequest } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';

export class OneStepPreApprovalBuilder extends TransactionBuilder {
  private _commandId: string;
  private _receiverPartyId: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.OneStepPreApproval;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.OneStepPreApproval;
  }

  setTransaction(transaction: CantonPrepareCommandResponse): void {
    this.transaction.prepareCommand = transaction;
  }

  /**
   * Sets the unique id for the 1-step enablement
   * Also sets the _id of the transaction
   *
   * @param id - A uuid
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  commandId(id: string): this {
    if (!id.trim()) {
      throw new Error('commandId must be a non-empty string');
    }
    this._commandId = id.trim();
    // also set the transaction _id
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the receiver for the 1-step enablement
   *
   * @param id - the receiver party id (address)
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  receiverPartyId(id: string): this {
    if (!id.trim()) {
      throw new Error('receiverPartyId must be a non-empty string');
    }
    this._receiverPartyId = id.trim();
    return this;
  }

  /**
   * Builds and returns the OneStepEnablementRequest object from the builder's internal state.
   *
   * This method performs validation before constructing the object. If required fields are
   * missing or invalid, it throws an error.
   *
   * @returns {OneStepEnablementRequest} - A fully constructed and validated request object for 1-step enablement.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): OneStepEnablementRequest {
    this.validate();

    return {
      commandId: this._commandId,
      receiverId: this._receiverPartyId,
      verboseHashing: false,
      actAs: [this._receiverPartyId],
      readAs: [],
    };
  }

  /**
   * Validates the internal state of the builder before building the request object.
   *
   * @private
   * @throws {Error} If any required field is missing or invalid.
   */
  private validate(): void {
    if (!this._commandId) throw new Error('commandId is missing');
    if (!this._receiverPartyId) throw new Error('receiver partyId is missing');
  }
}
