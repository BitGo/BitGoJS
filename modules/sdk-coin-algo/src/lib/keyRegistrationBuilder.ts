import BigNumber from 'bignumber.js';
import algosdk from 'algosdk';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { KeyRegTxnSchema } from './txnSchema';
import Utils from './utils';

export class KeyRegistrationBuilder extends TransactionBuilder {
  protected _voteKey: string;
  protected _selectionKey: string;
  protected _voteFirst: number;
  protected _voteLast: number;
  protected _voteKeyDilution: number;
  protected _nonParticipation: boolean;
  protected _stateProofKey: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Sets the vote key
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * @param {string} key The root participation public key. See Generate a Participation Key to learn more.
   * https://developer.algorand.org/docs/reference/transactions/#key-registration-transaction
   */
  voteKey(key: string): KeyRegistrationBuilder {
    this._voteKey = key;
    return this;
  }

  /**
   * Sets the selection key
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * @param {string} key The VRF public key for the account.
   * https://developer.algorand.org/docs/reference/transactions/#key-registration-transaction
   */
  selectionKey(key: string): KeyRegistrationBuilder {
    this._selectionKey = key;
    return this;
  }

  /**
   * Sets the stateProof key
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * @param {string} key The stateproof key. See consensus for more information.
   * https://developer.algorand.org/docs/get-details/algorand_consensus/?from_query=state#state-proof-keys
   */
  stateProofKey(key: string): KeyRegistrationBuilder {
    Utils.validateBase64(key);
    this._stateProofKey = key;
    return this;
  }

  /**
   *Sets the vote first round
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * @param {number} round The first round that the participation key is valid. Not to be confused with the FirstValid round of the keyreg transaction.
   * https://developer.algorand.org/docs/reference/transactions/#key-registration-transaction
   */
  voteFirst(round: number): KeyRegistrationBuilder {
    this.validateValue(new BigNumber(round));
    this._voteFirst = round;

    return this;
  }

  /**
   * Sets the vote last round
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * A recommended range is 3,000,000 rounds.
   *
   * @param {number} round No theoretical limit.
   * https://developer.algorand.org/docs/run-a-node/participate/generate_keys/
   */
  voteLast(round: number): KeyRegistrationBuilder {
    this.validateValue(new BigNumber(round));
    this._voteLast = round;

    return this;
  }

  /**
   * Sets the vote key dilution
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * Defaults to 10,000
   *
   * @param {number} size [10000]. To reduce the size of the participation key, set the key dilution value to roughly the square root of the range that the partkey is valid for.
   * https://developer.algorand.org/docs/run-a-node/participate/generate_keys/#generate-the-participation-key-with-goal
   * @param size
   */
  voteKeyDilution(size = 10000): KeyRegistrationBuilder {
    this.validateValue(new BigNumber(size));
    this._voteKeyDilution = size;

    return this;
  }

  /**
   * Sets the non participation flag
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * @param {boolean} nonParticipation All new Algorand accounts are participating by default.
   * This means that they earn rewards. Mark an account nonparticipating by setting this value to true and this account
   * will no longer earn rewards NEVER.
   * https://developer.algorand.org/docs/reference/transactions/#key-registration-transaction
   */
  nonParticipation(nonParticipation: boolean): KeyRegistrationBuilder {
    this._nonParticipation = nonParticipation;

    return this;
  }

  protected buildAlgoTxn(): algosdk.Transaction {
    return this.isOfflineKeyRegAccountLibTransaction()
      ? this.buildOfflineKeyRegTransaction()
      : this.isNonParticipationKeyRegAccountLibTransaction()
      ? this.buildNonParticipationKeyRegTransaction()
      : this.buildOnlineKeyRegTransaction();
  }

  private buildOfflineKeyRegTransaction(): algosdk.Transaction {
    return algosdk.makeKeyRegistrationTxnWithSuggestedParams(
      this._sender,
      this._note,
      undefined, // voteKey param
      undefined, // selectionKey param
      undefined, // voteFirst param
      undefined, // voteLast param
      undefined, // voteKeyDilution param
      this.suggestedParams
    );
  }

  private buildOnlineKeyRegTransaction(): algosdk.Transaction {
    return algosdk.makeKeyRegistrationTxnWithSuggestedParams(
      this._sender,
      this._note,
      this._voteKey,
      this._selectionKey,
      this._voteFirst,
      this._voteLast,
      this._voteKeyDilution,
      this.suggestedParams,
      undefined, // reKeyTo param
      undefined, // nonParticipation param
      this._stateProofKey
    );
  }

  private buildNonParticipationKeyRegTransaction(): algosdk.Transaction {
    return algosdk.makeKeyRegistrationTxnWithSuggestedParams(
      this._sender,
      this._note,
      undefined, // voteKey param
      undefined, // selectionKey param
      undefined, // voteFirst param
      undefined, // voteLast param
      undefined, // voteKeyDilution param
      this.suggestedParams,
      this._reKeyTo,
      true // nonParticipation param
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const algoTxn = tx.getAlgoTransaction();

    if (algoTxn) {
      if (this.isNonParticipationKeyRegAlgoSDKTransaction(algoTxn)) {
        this.nonParticipation(!!algoTxn.nonParticipation);
      } else if (this.isOnlineKeyRegAlgoSDKTransaction(algoTxn)) {
        this.voteKey(algoTxn.voteKey.toString('base64'));
        this.selectionKey(algoTxn.selectionKey.toString('base64'));
        this.voteFirst(algoTxn.voteFirst);
        this.voteLast(algoTxn.voteLast);
        this.voteKeyDilution(algoTxn.voteKeyDilution);
        if (algoTxn.stateProofKey) {
          this.stateProofKey(algoTxn.stateProofKey.toString('base64'));
        }
      }
    }
    return tx;
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: Uint8Array | string): void {
    const decodeTxn = Utils.decodeAlgoTxn(rawTransaction);
    const algoTxn = decodeTxn.txn;
    if (algoTxn.type !== algosdk.TransactionType.keyreg) {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${algoTxn.type}. Expected ${algosdk.TransactionType.keyreg}`
      );
    }

    if (this.isOnlineKeyRegAlgoSDKTransaction(algoTxn)) {
      this.validateFields(
        algoTxn.voteKey.toString('base64'),
        algoTxn.selectionKey.toString('base64'),
        algoTxn.voteFirst,
        algoTxn.voteLast,
        algoTxn.voteKeyDilution,
        algoTxn.stateProofKey && algoTxn.stateProofKey.toString('base64')
      );
    }
  }

  private isNonParticipationKeyRegAlgoSDKTransaction(algoTxn: algosdk.Transaction): boolean {
    return !!algoTxn.nonParticipation;
  }

  private isNonParticipationKeyRegAccountLibTransaction(): boolean {
    return !!this._nonParticipation;
  }

  private isOnlineKeyRegAlgoSDKTransaction(algoTxn: algosdk.Transaction): boolean {
    return !(
      this.isOfflineKeyRegAlgoSDKTransaction(algoTxn) || this.isNonParticipationKeyRegAlgoSDKTransaction(algoTxn)
    );
  }

  private isOnlineKeyRegAccountLibTransaction(): boolean {
    return !(this.isOfflineKeyRegAccountLibTransaction() || this.isNonParticipationKeyRegAccountLibTransaction());
  }

  private isOfflineKeyRegAlgoSDKTransaction(algoTxn: algosdk.Transaction): boolean {
    return (
      !algoTxn.voteKey &&
      !algoTxn.selectionKey &&
      !algoTxn.voteFirst &&
      !algoTxn.voteLast &&
      !algoTxn.voteKeyDilution &&
      !algoTxn.stateProofKey &&
      !algoTxn.nonParticipation
    );
  }

  private isOfflineKeyRegAccountLibTransaction(): boolean {
    return (
      !this._voteKey &&
      !this._selectionKey &&
      !this._voteFirst &&
      !this._voteLast &&
      !this._voteKeyDilution &&
      !this._stateProofKey &&
      !this._nonParticipation
    );
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    super.validateTransaction(transaction);
    if (this.isOnlineKeyRegAccountLibTransaction()) {
      // invalid offline will reach here
      this.validateFields(
        this._voteKey,
        this._selectionKey,
        this._voteFirst,
        this._voteLast,
        this._voteKeyDilution,
        this._stateProofKey
      );
    } else {
      // offline or nonparticipation transaction
      if (
        this._voteKey ||
        this._selectionKey ||
        this._voteFirst ||
        this._voteLast ||
        this._voteKeyDilution ||
        this._stateProofKey
      ) {
        throw new InvalidTransactionError(
          'VoteKey, SelectionKey, VoteFirst, VoteLast, VoteKeyDilution, StateProofKey fields cannot be set when offline or nonparticipation is set'
        );
      }
    }
  }

  private validateFields(
    voteKey: string,
    selectionKey: string,
    voteFirst: number,
    voteLast: number,
    voteKeyDilution: number,
    stateProofKey?: string
  ): void {
    const validationResult = KeyRegTxnSchema.validate({
      voteKey,
      selectionKey,
      voteFirst,
      voteLast,
      voteKeyDilution,
      stateProofKey,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
