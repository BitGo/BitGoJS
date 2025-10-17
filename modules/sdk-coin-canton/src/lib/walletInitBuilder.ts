import BigNumber from 'bignumber.js';

import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  InvalidTransactionError,
  PublicKey,
  Signature,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { KeyPair } from './keyPair';
import { IPublicKey, PreparedParty, WalletInitRequest } from './iface';
import utils from './utils';
import { WalletInitTransaction } from './walletInitialization/walletInitTransaction';
import { PUBLIC_KEY_FORMAT, PUBLIC_KEY_SPEC } from './constant';

export class WalletInitBuilder extends BaseTransactionBuilder {
  private _transaction: WalletInitTransaction;
  private _signatures: Signature[] = [];

  private _publicKey: IPublicKey;
  private _partyHint: string;
  private _localParticipantObservationOnly = false;
  private _otherConfirmingParticipantUids: string[] = [];
  private _confirmationThreshold = 1;
  private _observingParticipantUids: string[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new WalletInitTransaction(_coinConfig);
  }

  initBuilder(tx: WalletInitTransaction): void {
    this._transaction = tx;
  }

  protected buildImplementation(): Promise<WalletInitTransaction> {
    throw new Error('Not implemented');
  }

  protected fromImplementation(rawTransaction: any, isFirstSigner?: boolean): WalletInitTransaction {
    throw new Error('Not implemented');
  }

  protected signImplementation(key: BaseKey): WalletInitTransaction {
    throw new Error('Not implemented');
  }

  get transaction(): WalletInitTransaction {
    return this._transaction;
  }

  set transaction(transaction: PreparedParty) {
    this._transaction.preparedParty = transaction;
  }

  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  validateKey(key: BaseKey): void {
    let keyPair: KeyPair;
    try {
      keyPair = new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError('Invalid key');
    }
    if (!keyPair.getKeys().prv) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  validateRawTransaction(rawTransaction: string[]): void {
    if (!rawTransaction || !this._transaction.preparedParty) {
      throw new BuildTransactionError('invalid raw transaction');
    }
    const localHash = utils.computeHashFromCreatePartyResponse(rawTransaction);
    if (localHash !== this._transaction.preparedParty.multiHash) {
      throw new BuildTransactionError('invalid raw transaction, hash not matching');
    }
  }

  validateTransaction(transaction?: WalletInitTransaction): void {
    if (!transaction?.preparedParty) {
      return;
    }
    const localHash = utils.computeHashFromCreatePartyResponse(transaction.preparedParty.topologyTransactions);
    if (localHash !== this._transaction.preparedParty.multiHash) {
      throw new BuildTransactionError('invalid transaction');
    }
  }

  // not implemented because wallet initialization doesn't require any value
  validateValue(value: BigNumber): void {
    throw new Error('Not implemented');
  }

  /** @inheritDoc */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    if (!this.transaction) {
      throw new InvalidTransactionError('transaction is empty!');
    }
    this._signatures.push({ publicKey, signature });
    this.transaction.signatures = signature.toString('base64');
  }

  /**
   * Sets the public key used for signing.
   *
   * @param key - The public key of the wallet.
   * @returns The current builder instance for chaining.
   * @throws Error if key is not a valid public key
   */
  publicKey(key: string): this {
    utils.isValidPublicKey(key);
    this._publicKey = {
      format: PUBLIC_KEY_FORMAT,
      keyData: key,
      keySpec: PUBLIC_KEY_SPEC,
    };
    return this;
  }

  /**
   * Sets the party hint (alias or name) used during wallet initialization.
   *
   * @param hint - A 5-character non-empty string representing the party hint.
   * @returns The current builder instance for chaining.
   * @throws Error if the hint is empty or more than 5 characters long.
   */
  partyHint(hint: string): this {
    const trimmedHint = hint.trim();
    if (!trimmedHint) {
      throw new Error('partyHint cannot be empty');
    }
    if (trimmedHint.length > 5) {
      throw new Error('partyHint must be less than 6 characters long');
    }
    this._partyHint = trimmedHint;
    return this;
  }

  /**
   * Sets whether the local participant should be added in observation-only mode.
   *
   * @param flag - Boolean flag indicating observation-only status.
   * @returns The current builder instance for chaining.
   */
  localParticipantObservationOnly(flag: boolean): this {
    this._localParticipantObservationOnly = flag;
    return this;
  }

  /**
   * Adds a confirming participant UID to the list of other confirming participants.
   *
   * @param uid - A non-empty string UID of another confirming participant.
   * @returns The current builder instance for chaining.
   * @throws Error if the UID is empty.
   */
  otherConfirmingParticipantUid(uid: string): this {
    const trimmedUid = uid.trim();
    if (!trimmedUid) {
      throw new Error('otherConfirmingParticipantUid cannot be empty');
    }
    if (!this._otherConfirmingParticipantUids) {
      this._otherConfirmingParticipantUids = [];
    }
    this._otherConfirmingParticipantUids.push(trimmedUid);
    return this;
  }

  /**
   * Sets the confirmation threshold for the wallet initialization.
   *
   * @param threshold - A positive integer indicating how many confirmations are required.
   * @returns The current builder instance for chaining.
   * @throws Error if the threshold is not a positive integer.
   */
  confirmationThreshold(threshold: number): this {
    if (!Number.isInteger(threshold) || threshold <= 0) {
      throw new Error('confirmationThreshold must be a positive integer');
    }
    this._confirmationThreshold = threshold;
    return this;
  }

  /**
   * Adds an observing participant UID to the list of observers.
   *
   * @param uid - A non-empty string UID of the observing participant.
   * @returns The current builder instance for chaining.
   * @throws Error if the UID is empty.
   */
  observingParticipantUid(uid: string): this {
    const trimmedUid = uid.trim();
    if (!trimmedUid) {
      throw new Error('observingParticipantUid cannot be empty');
    }
    if (!this._observingParticipantUids) {
      this._observingParticipantUids = [];
    }
    this._observingParticipantUids.push(trimmedUid);
    return this;
  }

  /**
   * Builds and returns the WalletInitRequest object from the builder's internal state.
   *
   * This method performs validation before constructing the object. If required fields are
   * missing or invalid, it throws an error.
   *
   * @returns {WalletInitRequest} - A fully constructed and validated request object for wallet initialization.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): WalletInitRequest {
    this.validate();
    return {
      publicKey: this._publicKey,
      partyHint: this._partyHint,
      localParticipantObservationOnly: this._localParticipantObservationOnly,
      otherConfirmingParticipantUids: this._otherConfirmingParticipantUids,
      confirmationThreshold: this._confirmationThreshold,
      observingParticipantUids: this._observingParticipantUids,
    };
  }

  /**
   * Validates the internal state of the builder before building the request object.
   *
   * Checks for:
   * - Presence of a synchronizer ID.
   * - `partyHint` must not be empty and must be at most 5 characters long.
   * - Public key must include `keyData`, `format`, and `keySpec`.
   * - Confirmation threshold must be a positive integer.
   * - Confirming and observing participant UID lists must be arrays.
   *
   * @private
   * @throws {Error} If any required field is missing or invalid.
   */
  private validate(): void {
    if (!this._partyHint || this._partyHint.length > 5) throw new Error('Invalid partyHint');
    if (!this._publicKey || !this._publicKey.keyData || !this._publicKey.format || !this._publicKey.keySpec) {
      throw new Error('Invalid publicKey');
    }
    if (!Number.isInteger(this._confirmationThreshold) || this._confirmationThreshold <= 0) {
      throw new Error('Invalid confirmationThreshold');
    }
    if (!Array.isArray(this._otherConfirmingParticipantUids)) {
      throw new Error('otherConfirmingParticipantUids must be an array');
    }
    if (!Array.isArray(this._observingParticipantUids)) {
      throw new Error('observingParticipantUids must be an array');
    }
  }
}
