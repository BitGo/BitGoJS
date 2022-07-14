import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  PublicKey as BasePublicKey,
  Signature,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import * as nearAPI from 'near-api-js';
import { AddressValidationError } from './errors';
import utils from './utils';
import assert from 'assert';
import { KeyPair } from './keyPair';
import * as hex from '@stablelib/hex';
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;

  private _sender: string;
  private _publicKey: string;
  private _receiverId: string;
  private _nonce: number;
  private _recentBlockHash: string;
  private _signer: KeyPair;
  private _signatures: Signature[] = []; // only support single sig for now
  protected _actions: nearAPI.transactions.Action[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    const nearTransaction = tx.nearTransaction;
    this._sender = nearTransaction.signerId;
    this._nonce = nearTransaction.nonce;
    this._receiverId = nearTransaction.receiverId;
    this._publicKey = hex.encode(nearTransaction.publicKey.data);
    this._recentBlockHash = nearAPI.utils.serialize.base_encode(nearTransaction.blockHash);
    this._actions = nearTransaction.actions;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    this.validateRawTransaction(rawTransaction);
    this.buildImplementation();
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.nearTransaction = this.buildNearTransaction();
    if (this._signer) {
      this.transaction.sign(this._signer);
    }
    if (this._signatures?.length > 0) {
      this.transaction.constructSignedPayload(this._signatures[0].signature);
    }
    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this._signer = new KeyPair({ prv: key.key });
    return this._transaction;
  }

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new AddressValidationError(address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    try {
      new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError(`Key validation failed`);
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    try {
      nearAPI.utils.serialize.deserialize(
        nearAPI.transactions.SCHEMA,
        nearAPI.transactions.SignedTransaction,
        rawTransaction
      );
    } catch {
      try {
        nearAPI.utils.serialize.deserialize(
          nearAPI.transactions.SCHEMA,
          nearAPI.transactions.Transaction,
          rawTransaction
        );
      } catch {
        throw new BuildTransactionError('invalid raw transaction');
      }
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    if (!transaction.nearTransaction) {
      return;
    }
    this.validateAddress({ address: transaction.nearTransaction.signerId });
    this.validateAddress({ address: transaction.nearTransaction.receiverId });
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  // endregion

  /**
   * Sets the public key and the address of the sender of this transaction.
   *
   * @param {string} address the account that is sending this transaction
   * @param {string} pubKey the public key that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public sender(address: string, pubKey: string): this {
    if (!address || !utils.isValidAddress(address.toString())) {
      throw new BuildTransactionError('Invalid or missing address, got: ' + address);
    }
    if (!pubKey || !utils.isValidPublicKey(pubKey)) {
      throw new BuildTransactionError('Invalid or missing pubKey, got: ' + pubKey);
    }
    this._sender = address;
    this._publicKey = pubKey;
    return this;
  }

  /**
   * Sets the account Id of the receiver of this transaction.
   *
   * @param {string} accountId the account id of the account that is receiving this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public receiverId(accountId: string): this {
    utils.isValidAddress(accountId);
    this._receiverId = accountId;
    return this;
  }

  /**
   * Set the nonce
   *
   * @param {number} nonce - number that can be only used once
   * @returns {TransactionBuilder} This transaction builder
   */
  public nonce(nonce: number): this {
    if (nonce < 0) {
      throw new BuildTransactionError(`Invalid nonce: ${nonce}`);
    }
    this._nonce = nonce;
    return this;
  }

  /**
   * Sets the blockHash of this transaction.
   *
   * @param {string} blockHash the blockHash of this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public recentBlockHash(blockHash: string): this {
    if (!utils.isValidBlockId(blockHash)) {
      throw new BuildTransactionError(`Invalid blockHash ${blockHash}`);
    }
    this._recentBlockHash = blockHash;
    return this;
  }

  /**
   * Sets the list of actions of this transaction.
   *
   * @param {nearAPI.transactions.Action[]} value the the list of actions
   * @returns {TransactionBuilder} This transaction builder
   */
  protected actions(value: nearAPI.transactions.Action[]): this {
    this._actions = value;
    return this;
  }
  /**
   * Builds the NEAR transaction.
   *
   * @return {Transaction} near sdk transaction
   */
  protected buildNearTransaction(): nearAPI.transactions.Transaction {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._recentBlockHash, new BuildTransactionError('recent blockhash is required before building'));

    const tx = nearAPI.transactions.createTransaction(
      this._sender,
      nearAPI.utils.PublicKey.fromString(nearAPI.utils.serialize.base_encode(hex.decode(this._publicKey))),
      this._receiverId,
      this._nonce,
      this._actions,
      nearAPI.utils.serialize.base_decode(this._recentBlockHash)
    );

    return tx;
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push({ publicKey, signature });
  }
}
