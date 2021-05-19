import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotImplementedError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder } from './transactionBuilder';
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
    this._voteKey = key;
  }

  selectionKey(key: string): void {
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
    if (this._voteFirst && round < this._voteFirst) {
      throw new Error('VoteKey last round must be greater than first round');
    }
    this._voteLast = round;
  }

  /**
   * @param {number} size Defaults to 10,000. To reduce the size of the participation key, set the key dilution value to roughly the square root of the range that the partkey is valid for.
   * https://developer.algorand.org/docs/run-a-node/participate/generate_keys/#generate-the-participation-key-with-goal
   */
  voteKeyDilution(size: number = 10000): void {
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
  protected buildImplementation(): Promise<Transaction> {
    throw new NotImplementedError('buildImplementation not implemented');
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: unknown): Transaction {
    throw new NotImplementedError('fromImplementation not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('signImplementation not implemented');
  }
}
