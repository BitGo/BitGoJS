import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as rippleTypes from 'ripple-lib/dist/npm/transaction/types';
import binaryCodec from 'ripple-binary-codec';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError } from '../baseCoin/errors';
import { SignedTransaction, TxJSON, Signer } from './iface';
import { KeyPair } from './keyPair';
import { initApi } from './utils';

export class Transaction extends BaseTransaction {
  private _xrpTransaction?: rippleTypes.TransactionJSON;
  private _signedTransaction?: SignedTransaction;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Get the list of signatures (if any) produced for this transaction.
   *
   * @returns {string[]} list of signatures
   */
  get signature(): string[] {
    if (!this._signedTransaction) {
      return [];
    }
    const decodedTx = binaryCodec.decode(this._signedTransaction?.signedTransaction);
    if (decodedTx.Signers) {
      const signers = decodedTx.Signers as unknown as { Signer: Signer }[];
      return signers.map(({ Signer }) => Signer.TxnSignature);
    }
    return [];
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

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
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
    if (keyPair.length > 0) {
      const keys = {
        privateKey: keyPair[0].getKeys().prv,
        publicKey: keyPair[0].getKeys().pub,
      };
      const txJSON = JSON.stringify(this._xrpTransaction);
      this._signedTransaction = initApi().sign(txJSON, keys, { signAs: keyPair[0].getAddress() });
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
      fee: this._xrpTransaction.Fee as string,
      sequence: this._xrpTransaction.Sequence as number,
      lastLedgerSequence: this._xrpTransaction.LastLedgerSequence as number,
    };
    if (this.type === TransactionType.Send) {
      result.amount = this._xrpTransaction.Amount as string;
      result.destination = this._xrpTransaction.Destination as string;
      result.destinationTag = this._xrpTransaction.DestinationTag as string;
    }
    if (this.type === TransactionType.WalletInitialization) {
      result.domain = this._xrpTransaction.Domain as string;
      result.setFlag = this._xrpTransaction.SetFlag as number;
      result.messageKey = this._xrpTransaction.MessageKey as string;
    }
    return result;
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this._xrpTransaction) {
      return;
    }
    if (this.type === TransactionType.Send) {
      this._outputs = [
        {
          address: this._xrpTransaction.Destination as string,
          value: this._xrpTransaction.Amount as string,
          coin: this._coinConfig.name,
        },
      ];

      this._inputs = [
        {
          address: this._xrpTransaction.Account,
          value: this._xrpTransaction.amount as string,
          coin: this._coinConfig.name,
        },
      ];
    }
  }
}
