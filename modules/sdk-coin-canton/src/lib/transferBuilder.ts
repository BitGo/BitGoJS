import { InvalidTransactionError, PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';
import { CantonPrepareCommandResponse, CantonTransferRequest } from './iface';
import utils from './utils';

export class TransferBuilder extends TransactionBuilder {
  private _commandId: string;
  private _senderId: string;
  private _receiverId: string;
  private _amount: number;
  private _sendOneStep = false;
  private _expiryEpoch: number;
  private _memoId: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.Send;
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
   * Sets the unique id for the transfer
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
   * Sets the sender party id for the transfer
   * @param id - sender address (party id)
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  senderId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('senderId must be a non-empty string');
    }
    this._senderId = id.trim();
    return this;
  }

  /**
   * Sets the receiver party id for the transfer
   * @param id - receiver address (party id)
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  receiverId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('receiverId must be a non-empty string');
    }
    this._receiverId = id.trim();
    return this;
  }

  /**
   * Sets the transfer amount
   * @param amount - transfer amount
   * @returns The current builder instance for chaining.
   * @throws Error if amount not present or negative
   */
  amount(amount: number): this {
    if (!amount || amount < 0) {
      throw new Error('amount must be a positive number');
    }
    this._amount = amount;
    return this;
  }

  /**
   * Sets the 1-step enablement flag to send via 1-step, works only if recipient
   * enabled the 1-step, defaults to `false`
   * @param flag boolean value
   * @returns The current builder for chaining
   */
  sendOneStep(flag: boolean): this {
    this._sendOneStep = flag;
    return this;
  }

  /**
   * Sets the transfer expiry
   * @param epoch - the expiry for 2-step transfer, defaults to 90 days and
   * not applicable if sending via 1-step
   * @returns The current builder for chaining
   * @throws Error if the expiry value is invalid
   */
  expiryEpoch(epoch: number): this {
    if (!epoch || epoch < 0) {
      throw new Error('epoch must be a positive number');
    }
    this._expiryEpoch = epoch;
    return this;
  }

  /**
   * Sets the optional memoId if present
   * @param id - memoId of the recipient
   * @returns The current builder for chaining
   * @throws Error if the memoId value is invalid
   */
  memoId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('memoId must be a non-empty string');
    }
    this._memoId = id.trim();
    return this;
  }

  /**
   * Get the canton transfer request object
   * @returns CantonTransferRequest
   * @throws Error if any required params are missing
   */
  toRequestObject(): CantonTransferRequest {
    this.validate();
    const data: CantonTransferRequest = {
      commandId: this._commandId,
      senderPartyId: this._senderId,
      receiverPartyId: this._receiverId,
      amount: this._amount,
      expiryEpoch: this._expiryEpoch,
      sendViaOneStep: this._sendOneStep,
    };
    if (this._memoId) {
      data.memoId = this._memoId;
    }
    return data;
  }

  /**
   * Method to validate the required fields
   * @throws Error if required fields are not set
   * @private
   */
  private validate(): void {
    if (!this._commandId) throw new Error('commandId is missing');
    if (!this._senderId) throw new Error('senderId is missing');
    if (!this._receiverId) throw new Error('receiverId is missing');
    if (!this._amount) throw new Error('amount is missing');
    if (!this._expiryEpoch) throw new Error('expiryEpoch is missing');
  }
}
