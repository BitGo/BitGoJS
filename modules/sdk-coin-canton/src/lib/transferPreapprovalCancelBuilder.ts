import { InvalidTransactionError, PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, CantonTransferPreapprovalCancelRequest } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';
import utils from './utils';

/**
 * Builds a transaction that reverts an active 1-step TransferPreapproval back to 2-step
 * approval — the counterpart to OneStepPreApprovalBuilder. Structurally identical (same
 * commandId/receiverPartyId/tokenName inputs, same request-object shape); the two are kept as
 * separate builders/TransactionTypes (rather than a single builder with a direction flag) so
 * each carries its own dedicated verifyTransaction validation, mirroring every other canton
 * operation's one-intent-per-builder convention.
 */
export class TransferPreapprovalCancelBuilder extends TransactionBuilder {
  private _commandId: string;
  private _receiverPartyId: string;
  private _tokenName: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.TransferPreapprovalCancel;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.TransferPreapprovalCancel;
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
   * Sets the unique id for the preapproval cancel.
   * Also sets the _id of the transaction.
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
   * Sets the receiver (the party whose TransferPreapproval is being cancelled).
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
   * Sets the optional token field if present, used for canton token preApproval cancellation.
   * @param name - the bitgo name of the token
   * @returns The current builder for chaining
   * @throws Error if name is invalid
   */
  tokenName(name: string): this {
    if (!name || !name.trim()) {
      throw new Error('token name must be a non-empty string');
    }
    this._tokenName = name.trim();
    return this;
  }

  /**
   * Builds and returns the CantonTransferPreapprovalCancelRequest object from the builder's
   * internal state.
   *
   * This method performs validation before constructing the object. If required fields are
   * missing or invalid, it throws an error.
   *
   * @returns {CantonTransferPreapprovalCancelRequest} - A fully constructed and validated request object.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): CantonTransferPreapprovalCancelRequest {
    this.validate();

    return {
      commandId: this._commandId,
      receiverId: this._receiverPartyId,
      verboseHashing: false,
      actAs: [this._receiverPartyId],
      readAs: [],
      tokenName: this._tokenName,
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
