import assert from 'assert';
import BigNumber from 'bignumber.js';

import * as hex from '@stablelib/hex';
import * as nearAPI from 'near-api-js';
import { DelegateAction } from '@near-js/transactions';

import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  PublicKey as BasePublicKey,
  Signature,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { AddressValidationError } from './errors';
import { BLOCK_HEIGHT_TTL } from './constants';
import { DelegateTransaction } from './delegateTransaction';
import { InitializableBuilder } from './initializableBuilder';
import { KeyPair } from './keyPair';
import utils from './utils';

export abstract class AbstractDelegateBuilder extends BaseTransactionBuilder implements InitializableBuilder {
  private _delegateTransaction: DelegateTransaction;

  private _sender: string;
  private _publicKey: string;
  protected _receiverId: string;
  private _nonce: bigint;
  private _recentBlockHeight: bigint;
  private _signer: KeyPair;
  private _signatures: Signature[] = [];
  protected _actions: nearAPI.transactions.Action[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._delegateTransaction = new DelegateTransaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: DelegateTransaction): void {
    this._delegateTransaction = tx;
    const nearDelegateAction = tx.nearTransaction;
    this._sender = nearDelegateAction.senderId;
    this._nonce = nearDelegateAction.nonce;
    this._receiverId = nearDelegateAction.receiverId;
    if (nearDelegateAction.publicKey.ed25519Key?.data) {
      this._publicKey = hex.encode(nearDelegateAction.publicKey.ed25519Key.data);
    }
    this._recentBlockHeight = nearDelegateAction.maxBlockHeight;
    this._actions = nearDelegateAction.actions;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): DelegateTransaction {
    this.validateRawTransaction(rawTransaction);
    this.buildImplementation();
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<DelegateTransaction> {
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
  protected signImplementation(key: BaseKey): DelegateTransaction {
    this._signer = new KeyPair({ prv: key.key });
    return this._delegateTransaction;
  }

  /** @inheritdoc */
  protected get transaction(): DelegateTransaction {
    return this._delegateTransaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: DelegateTransaction) {
    this._delegateTransaction = transaction;
  }

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
      nearAPI.utils.serialize.deserialize(nearAPI.transactions.SCHEMA.SignedDelegate, rawTransaction);
    } catch {
      try {
        nearAPI.utils.serialize.deserialize(nearAPI.transactions.SCHEMA.DelegateAction, rawTransaction);
      } catch {
        throw new BuildTransactionError('invalid raw transaction');
      }
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction: DelegateTransaction): void {
    if (!transaction.nearTransaction) {
      return;
    }
    this.validateAddress({ address: transaction.nearTransaction.senderId });
    this.validateAddress({ address: transaction.nearTransaction.receiverId });
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /**
   * Sets the public key and the address of the sender of this transaction.
   *
   * @param {string} address the account that is sending this transaction
   * @param {string} pubKey the public key that is sending this transaction
   * @returns {AbstractDelegateBuilder} The delegate transaction builder
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
   * Sets the account id of the receiver of this transaction.
   *
   * @param {string} accountId the account id of the account that is receiving this transaction
   * @returns {AbstractDelegateBuilder} The delegate transaction builder
   */
  public receiverId(accountId: string): this {
    utils.isValidAddress(accountId);
    this._receiverId = accountId;
    return this;
  }

  /**
   * Set the nonce
   *
   * @param {bigint} nonce - number that can be only used once
   * @returns {AbstractDelegateBuilder} This delegate transaction builder
   */
  public nonce(nonce: bigint): this {
    if (nonce < 0) {
      throw new BuildTransactionError(`Invalid nonce: ${nonce}`);
    }
    this._nonce = nonce;
    return this;
  }

  /**
   * Sets the recent block height for this transaction
   *
   * @param {string} blockHeight the blockHeight of this transaction
   * @returns {AbstractDelegateBuilder} The delegate transaction builder
   */
  public recentBlockHeight(blockHeight: bigint): this {
    this._recentBlockHeight = blockHeight;
    return this;
  }

  /**
   * Sets the list of actions of this transaction.
   *
   * @param {nearAPI.transactions.Action[]} value the list of actions
   * @returns {AbstractDelegateBuilder} The delegate transaction builder
   */
  protected actions(value: nearAPI.transactions.Action[]): this {
    this._actions = value;
    return this;
  }

  /**
   * Sets the action for this transaction/
   *
   * @param {nearAPI.transactions.Action} value the delegate action
   * @returns {AbstractDelegateBuilder} The delegate transaction builder
   */
  protected action(value: nearAPI.transactions.Action): this {
    this._actions ? this._actions.push(value) : (this._actions = [value]);
    return this;
  }

  /**
   * Builds the NEAR delegate action.
   *
   * @return {DelegateAction} near sdk delegate action
   */
  protected buildNearTransaction(): DelegateAction {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._recentBlockHeight, new BuildTransactionError('recent block height is required before building'));

    const tx = new DelegateAction({
      senderId: this._sender,
      receiverId: this._receiverId,
      actions: this._actions,
      nonce: this._nonce,
      maxBlockHeight: BigInt(BLOCK_HEIGHT_TTL + this._recentBlockHeight),
      publicKey: nearAPI.utils.PublicKey.fromString(nearAPI.utils.serialize.base_encode(hex.decode(this._publicKey))),
    });

    return tx;
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push({ publicKey, signature });
  }
}
