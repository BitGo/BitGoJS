import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as rippleTypes from 'ripple-lib/dist/npm/transaction/types';
import binaryCodec from 'ripple-binary-codec';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError } from '../baseCoin/errors';
import { SignedXRPTransaction, TxJSON } from './iface';
import { KeyPair } from './keyPair';
import { initApi } from './utils';

export class Transaction extends BaseTransaction {
  private _xrpTransaction?: rippleTypes.TransactionJSON;
  private _signedTransaction?: SignedXRPTransaction;
  private _halfSignedTransactions: string[];
  private _sender: string;
  private _numberOfRequiredSigners: number;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._numberOfRequiredSigners = 0;
    this._halfSignedTransactions = [];
  }

  sender(address: string): void {
    this._sender = address;
  }

  /**
   * Sets xrp transaction.
   *
   * @param {rippleTypes.TransactionJSON} tx
   */

  setXRPTransaction(tx: rippleTypes.TransactionJSON): void {
    this._xrpTransaction = tx;
  }

  /**
   * Get underlaying xrp transaction.
   *
   * @returns {rippleTypes.TransactionJSON}
   */

  getXRPTransaction(): rippleTypes.TransactionJSON | undefined {
    return this._xrpTransaction;
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  get numberOfRequiredSigners(): number {
    return this._numberOfRequiredSigners;
  }

  /**
   * Sets the number of signers required for signing this transaction.
   *
   * @param {number} num Threshold number of signers.
   */
  setNumberOfRequiredSigners(num: number): void {
    this._numberOfRequiredSigners = num;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    if (this._numberOfRequiredSigners === 0) {
      return false;
    }
    if (this._numberOfRequiredSigners === 1) {
      const kp = new KeyPair({ prv: key });
      const addr = kp.getAddress();
      if (addr === this._sender) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  /**
   * Signs transaction.
   *
   * @param {KeyPair} keyPair Signer keys.
   */
  sign(keyPair: KeyPair[]): void {
    if (!this._xrpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._numberOfRequiredSigners === 1) {
      const txJSON = JSON.stringify(this._xrpTransaction);
      this._signedTransaction = initApi().sign(txJSON, keyPair[0]);
    } else if (this._numberOfRequiredSigners > 1) {
      const txJSON = JSON.stringify(this._xrpTransaction);
      keyPair.forEach((key) => {
        const signedTx = initApi().sign(txJSON, key, { signAs: key.getAddress() }).signedTransaction;
        this._halfSignedTransactions.push(signedTx);
      });
      this._signedTransaction = initApi().combine(this._halfSignedTransactions) as SignedXRPTransaction;
    }
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._xrpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._signedTransaction) {
      return this._signedTransaction.signedTransaction;
    } else {
      return binaryCodec.encode(this._xrpTransaction);
    }
  }

  /** @inheritdoc */
  toJson(): TxJSON {
    if (!this._xrpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const result: TxJSON = {
      account: this._xrpTransaction.Account,
      type: this._xrpTransaction.TransactionType,
      memos: this._xrpTransaction.Memos,
      flags: this._xrpTransaction.Flags,
      fulfillment: this._xrpTransaction.Fulfillment,
    };
    if (this.type === TransactionType.Send) {
      result.amount = this._xrpTransaction.amount as string;
      result.destination = this._xrpTransaction.destination as string;
    }
    return result;
  }
}
