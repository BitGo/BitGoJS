import { InvalidTransactionError, PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, CantonTransferAcceptRejectRequest } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';
import utils from './utils';

export class AllocationRejectBuilder extends TransactionBuilder {
  private _commandId: string;
  private _contractId: string;
  private _actAsPartyId: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.AllocationReject;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.AllocationReject;
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
   * Sets the unique id for the allocation rejection
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
   * Sets the allocation rejection contract id
   *
   * @param id - canton allocation rejection contract id
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
   * Sets the party acting as the rejector
   *
   * @param id - the party id (address)
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  actAs(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('actAsPartyId must be a non-empty string');
    }
    this._actAsPartyId = id.trim();
    return this;
  }

  /**
   * Builds and returns the CantonTransferAcceptRejectRequest object from the builder's internal state.
   *
   * @returns {CantonTransferAcceptRejectRequest} - A fully constructed and validated request object for allocation rejection.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): CantonTransferAcceptRejectRequest {
    this.validate();

    return {
      commandId: this._commandId,
      contractId: this._contractId,
      verboseHashing: false,
      actAs: [this._actAsPartyId],
      readAs: [],
    };
  }

  private validate(): void {
    if (!this._commandId) throw new Error('commandId is missing');
    if (!this._contractId) throw new Error('contractId is missing');
    if (!this._actAsPartyId) throw new Error('actAs partyId is missing');
  }
}
