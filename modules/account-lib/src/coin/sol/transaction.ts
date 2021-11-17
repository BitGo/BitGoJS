import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';
import { KeyPair } from '.';
import { Transaction as SolTransaction } from '@solana/web3.js';

export class Transaction extends BaseTransaction {
  private _solTransaction: SolTransaction;
  protected _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Set Solana transaction.
   *
   * @param {SolTransaction} tx
   */
  setSolTransaction(tx: SolTransaction): void {
    this._solTransaction = tx;
  }

  /**
   * Get Solana transaction.
   *
   * @return {SolTransaction} Solana Transaction
   */
  get SolTransaction(): SolTransaction {
    return this._solTransaction;
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    throw new NotImplementedError('canSign not implemented');
  }

  sign(keyPair: KeyPair | KeyPair[]): void {
    throw new NotImplementedError('sign not implemented');
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    throw new NotImplementedError('toBroadcastFormat not implemented');
  }

  /** @inheritdoc */
  toJson(): any {
    throw new NotImplementedError('toJson not implemented');
  }
}
