import BigNumber from 'bignumber.js';
import algosdk from 'algosdk';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '../baseCoin';
import { InvalidTransactionError } from '../baseCoin/errors';
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

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }
  /**
   * Sets the vote key
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * @param {number} key The root participation public key. See Generate a Participation Key to learn more.
   * https://developer.algorand.org/docs/reference/transactions/#key-registration-transaction
   */
  voteKey(key: string): KeyRegistrationBuilder {
    this._voteKey = key;
    return this;
  }
  /**
   *Sets the selection key
   *
   * @returns {KeyRegistrationBuilder} This Key Registration builder.
   *
   * @param {number} key The VRF public key for the account.
   * https://developer.algorand.org/docs/reference/transactions/#key-registration-transaction
   */
  selectionKey(key: string): KeyRegistrationBuilder {
    this._selectionKey = key;
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
   * @param {boolean} nonPart. All new Algorand accounts are participating by default.
   * This means that they earn rewards. Mark an account nonparticipating by setting this value to true and this account
   * will no longer earn rewards
   * https://developer.algorand.org/docs/reference/transactions/#key-registration-transaction
   */
  nonParticipation(nonParticipation: boolean): KeyRegistrationBuilder {
    this._nonParticipation = nonParticipation;

    return this;
  }

  protected buildAlgoTxn(): algosdk.Transaction {
    if (!this._nonParticipation) {
      return algosdk.makeKeyRegistrationTxnWithSuggestedParams(
        this._sender,
        this._note,
        this._voteKey,
        this._selectionKey,
        this._voteFirst,
        this._voteLast,
        this._voteKeyDilution,
        this.suggestedParams,
      );
    } else {
      return algosdk.makeKeyRegistrationTxnWithSuggestedParams(
        this._sender,
        this._note,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        this.suggestedParams,
        this._reKeyTo,
        this._nonParticipation,
      );
    }
  }

  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const algoTxn = tx.getAlgoTransaction();

    if (algoTxn) {
      if (!algoTxn.nonParticipation) {
        this.voteKey(algoTxn.voteKey.toString('base64'));
        this.selectionKey(algoTxn.selectionKey.toString('base64'));
        this.voteFirst(algoTxn.voteFirst);
        this.voteLast(algoTxn.voteLast);
        this.voteKeyDilution(algoTxn.voteKeyDilution);
      } else {
        this.nonParticipation(algoTxn.nonParticipation);
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
        `Invalid Transaction Type: ${algoTxn.type}. Expected ${algosdk.TransactionType.keyreg}`,
      );
    }

    if (!algoTxn.nonParticipation) {
      this.validateFields(
        algoTxn.voteKey.toString('base64'),
        algoTxn.selectionKey.toString('base64'),
        algoTxn.voteFirst,
        algoTxn.voteLast,
        algoTxn.voteKeyDilution,
      );
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    super.validateTransaction(transaction);
    if (!this._nonParticipation) {
      this.validateFields(this._voteKey, this._selectionKey, this._voteFirst, this._voteLast, this._voteKeyDilution);
    }
  }

  private validateFields(
    voteKey: string,
    selectionKey: string,
    voteFirst: number,
    voteLast: number,
    voteKeyDilution: number,
  ): void {
    const validationResult = KeyRegTxnSchema.validate({
      voteKey,
      selectionKey,
      voteFirst,
      voteLast,
      voteKeyDilution,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
