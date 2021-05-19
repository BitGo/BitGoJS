import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotImplementedError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

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
    // return this;
  }

  selectionKey(key: string): void {
    this._selectionKey = key;
    // return this;
  }

  voteFirst(round: number): void {
    if (round < 1) {
      throw new Error('First round of voting must be greater than 1');
    }
    this._voteFirst = round;
  }

  voteLast(round: number = 3000000): void {
    if (round < 1) {
      throw new Error('First round of voting must be greater than 1');
    }
    this._voteFirst = round;
  }

  voteKeyDilution(size: number = 10000): void {
    if (this._voteFirst && this._voteLast) {
      if (size <= Math.sqrt(this._voteLast - this._voteFirst)) {
        this._voteKeyDilution = size;
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
