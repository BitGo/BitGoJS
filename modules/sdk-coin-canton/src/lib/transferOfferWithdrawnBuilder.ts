import { InvalidTransactionError, PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, CantonTransferOfferWithdrawnRequest } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';
import utils from './utils';

export class TransferOfferWithdrawnBuilder extends TransactionBuilder {
  private _commandId: string;
  private _contractId: string;
  private _actAsPartyId: string;
  private _tokenName: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.TransferOfferWithdrawn;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.TransferOfferWithdrawn;
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
   * Sets the unique id for the transfer offer withdrawn
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
    // also set the transaction _id
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the contract id the receiver needs to withdraw
   * @param id - canton withdrawn contract id
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
   * The sender who wants to withdraw the offer
   *
   * @param id - the sender party id
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
   * The token name to withdraw the offer
   * @param name - the bitgo name of the asset
   * @returns The current builder instance for chaining.
   * @throws Error if name is empty.
   */
  tokenName(name: string): this {
    if (!name || !name.trim()) {
      throw new Error('tokenName must be a non-empty string');
    }
    this._tokenName = name.trim();
    return this;
  }

  /**
   * Builds and returns the CantonTransferOfferWithdrawnRequest object from the builder's internal state.
   *
   * This method performs validation before constructing the object. If required fields are
   * missing or invalid, it throws an error.
   *
   * @returns {CantonTransferOfferWithdrawnRequest} - A fully constructed and validated request object for transfer offer withdrawal.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): CantonTransferOfferWithdrawnRequest {
    this.validate();

    return {
      commandId: this._commandId,
      contractId: this._contractId,
      verboseHashing: false,
      actAs: [this._actAsPartyId],
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
    if (!this._contractId) throw new Error('contractId is missing');
    if (!this._actAsPartyId) throw new Error('receiver partyId is missing');
  }
}
