/* eslint-disable @typescript-eslint/no-non-null-assertion */
import BigNumber from 'bignumber.js';
import algosdk from 'algosdk';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, InvalidParameterValueError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionType } from '../baseCoin';
export class KeyRegistrationBuilder extends TransactionBuilder {
  protected _voteKey?: string;
  protected _selectionKey?: string;
  protected _voteFirst?: number;
  protected _voteLast?: number;
  protected _voteKeyDilution?: number;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  voteKey(key: string): void {
    if (!key) {
      throw new InvalidParameterValueError('voteKey can not be undefined');
    }
    this._voteKey = key;
  }

  selectionKey(key: string): void {
    if (!key) {
      throw new InvalidParameterValueError('selectionKey can not be undefined');
    }
    this._selectionKey = key;
  }

  voteFirst(round: number): void {
    this.validateValue(new BigNumber(round));
    this._voteFirst = round;
  }

  /**
   *
   * @param {number} round No theoretical limit. A recommended range is 3,000,000 rounds.
   * https://developer.algorand.org/docs/run-a-node/participate/generate_keys/
   */
  voteLast(round: number = 3000000): void {
    this.validateValue(new BigNumber(round));
    if (this._voteFirst && round <= this._voteFirst) {
      throw new Error('VoteKey last round must be greater than first round');
    }
    this._voteLast = round;
  }

  /**
   * @param {number} size Defaults to 10,000. To reduce the size of the participation key, set the key dilution value to roughly the square root of the range that the partkey is valid for.
   * https://developer.algorand.org/docs/run-a-node/participate/generate_keys/#generate-the-participation-key-with-goal
   */
  voteKeyDilution(size: number = 10000): void {
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
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setAlgoTransaction(
      algosdk.makeKeyRegistrationTxn(
        this._sender!,
        this._fee!,
        this._firstRound!,
        this._lastRound!,
        this._note!,
        this._genesisHash!,
        this._genesisId!,
        this._voteKey!,
        this._selectionKey!,
        this._voteFirst!,
        this._voteLast!,
        this._voteKeyDilution!,
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
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);
    this.validateMandatoryFields();
  }

  private validateMandatoryFields(): void {
    if (!this._voteKey) {
      throw new BuildTransactionError('Invalid transaction: missing voteKey');
    }
    if (!this._selectionKey) {
      throw new BuildTransactionError('Invalid transaction: missing selectionKey');
    }
    if (!this._voteFirst) {
      throw new BuildTransactionError('Invalid transaction: missing voteFirst');
    }
    if (!this._voteLast) {
      throw new BuildTransactionError('Invalid transaction: missing voteLast');
    }
    if (!this._voteKeyDilution) {
      throw new BuildTransactionError('Invalid transaction: missing voteKeyDilution');
    }
  }
}
