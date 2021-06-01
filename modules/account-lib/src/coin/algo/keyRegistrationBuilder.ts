/* eslint-disable @typescript-eslint/no-non-null-assertion */
import BigNumber from 'bignumber.js';
import algosdk from 'algosdk';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidParameterValueError, InvalidTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionType } from '../baseCoin';
import { KeyRegTxnSchema } from './txnSchema';
export class KeyRegistrationBuilder extends TransactionBuilder {
  protected _voteKey: string;
  protected _selectionKey: string;
  protected _voteFirst: number;
  protected _voteLast: number;
  protected _voteKeyDilution: number;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  voteKey(key: string): KeyRegistrationBuilder {
    if (!key) {
      throw new InvalidParameterValueError('voteKey can not be undefined');
    }
    this._voteKey = key;
    return this;
  }

  selectionKey(key: string): KeyRegistrationBuilder {
    if (!key) {
      throw new InvalidParameterValueError('selectionKey can not be undefined');
    }
    this._selectionKey = key;
    return this;
  }

  voteFirst(round: number): KeyRegistrationBuilder {
    this.validateValue(new BigNumber(round));
    this._voteFirst = round;
    return this;
  }

  /**
   *
   * @param {number} round No theoretical limit. A recommended range is 3,000,000 rounds.
   * https://developer.algorand.org/docs/run-a-node/participate/generate_keys/
   */
  voteLast(round: number = 3000000): KeyRegistrationBuilder {
    this.validateValue(new BigNumber(round));
    if (this._voteFirst && round <= this._voteFirst) {
      throw new Error('VoteKey last round must be greater than first round');
    }
    this._voteLast = round;
    return this;
  }

  /**
   * @param {number} size Defaults to 10,000. To reduce the size of the participation key, set the key dilution value to roughly the square root of the range that the partkey is valid for.
   * https://developer.algorand.org/docs/run-a-node/participate/generate_keys/#generate-the-participation-key-with-goal
   */
  voteKeyDilution(size: number = 10000): KeyRegistrationBuilder {
    this.validateValue(new BigNumber(size));
    if (this._voteFirst && this._voteLast) {
      if (size <= Math.sqrt(this._voteLast - this._voteFirst)) {
        this._voteKeyDilution = size;
      } else {
        throw new Error(
          'Key dilution value must be less than or equal to the square root of the voteKey validity range.',
        );
      }
    }
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setAlgoTransaction(
      algosdk.makeKeyRegistrationTxnWithSuggestedParams(
        this._sender,
        this._note,
        this._voteKey,
        this._selectionKey,
        this._voteFirst,
        this._voteLast,
        this._voteKeyDilution,
        this.suggestedParams,
      ),
    );
    this.transaction.setTransactionType(TransactionType.KeyRegistration);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const algoTx = tx.getAlgoTransaction();
    if (algoTx) {
      this.voteKey(algoTx.voteKey.toString('base64'));
      this.selectionKey(algoTx.selectionKey.toString('base64'));
      this.voteFirst(algoTx.voteFirst);
      this.voteLast(algoTx.voteLast);
      this.voteKeyDilution(algoTx.voteKeyDilution);
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    super.validateTransaction(transaction);
    const validationResult = KeyRegTxnSchema.validate({
      voteKey: this._voteKey,
      selectionKey: this._selectionKey,
      voteFirst: this._voteFirst,
      voteLast: this._voteLast,
      voteKeyDilution: this._voteKeyDilution,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
