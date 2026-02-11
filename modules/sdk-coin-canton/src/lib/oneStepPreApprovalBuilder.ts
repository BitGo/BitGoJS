import { InvalidTransactionError, PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, CantonOneStepEnablementRequest } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';
import utils from './utils';

export class OneStepPreApprovalBuilder extends TransactionBuilder {
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
    return TransactionType.OneStepPreApproval;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.OneStepPreApproval;
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
   * Sets the optional token field if present, used for canton token preApproval setup
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
   * Builds and returns the CantonOneStepEnablementRequest object from the builder's internal state.
   *
   * This method performs validation before constructing the object. If required fields are
   * missing or invalid, it throws an error.
   *
   * @returns {CantonOneStepEnablementRequest} - A fully constructed and validated request object for 1-step enablement.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): CantonOneStepEnablementRequest {
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
