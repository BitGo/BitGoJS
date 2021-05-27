import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { ParseTransactionError, InvalidTransactionError, InvalidKey } from '../baseCoin/errors';
import utils from './utils';
import { KeyPair } from './keyPair';
import { TxData } from './ifaces';

export class Transaction extends BaseTransaction {
  private _algoTransaction?: algosdk.Transaction;
  private _signedTransaction?: algosdk.EncodedSignedTransaction;
  private _numberOfRequiredSigners: number;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._numberOfRequiredSigners = 0;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    if (!this._algoTransaction) {
      return false;
    }
    if (this._numberOfRequiredSigners === 0) {
      return false;
    }
    if (this._numberOfRequiredSigners === 1) {
      const sender = algosdk.encodeAddress(this._algoTransaction.from.publicKey);
      const addr = algosdk.encodeAddress(utils.toUint8Array(key));
      if (addr === sender) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  }

  /**
   * Signs transaction.
   *
   * @param {KeyPair} keyPair Signer keys.
   */
  sign(keyPair: KeyPair): void {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const { prv } = keyPair.getKeys();
    if (prv) {
      const signed = algosdk.signTransaction(this._algoTransaction, utils.toUint8Array(prv));
      this._signedTransaction = algosdk.decodeSignedTransaction(signed.blob);
    } else {
      throw new InvalidKey('Private key undefined');
    }
  }

  /**
   * Signs multisig transaction.
   *
   * @param {KeyPair} keyPair Signers keys.
   */
  signMultiSig(keyPair: KeyPair[]): void {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const signers = keyPair.map((kp) => kp.getAddress());
    const multiSigOptions = {
      version: 1,
      threshold: this._numberOfRequiredSigners,
      addrs: signers,
    };
    const msigAddress = algosdk.multisigAddress(multiSigOptions);
    this._algoTransaction.from = algosdk.decodeAddress(msigAddress);
    const tx = this._algoTransaction;
    const signatures: Uint8Array[] = keyPair.reduce<Uint8Array[]>((result, kp) => {
      const { prv } = kp.getKeys();
      if (prv) {
        result.push(algosdk.signMultisigTransaction(tx, multiSigOptions, utils.toUint8Array(prv)).blob);
      }
      return result;
    }, []);
    const signed = algosdk.mergeMultisigTransactions(signatures);
    this._signedTransaction = algosdk.decodeSignedTransaction(signed);
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

  /**
   * Sets algo transaction.
   *
   * @param {algosdk.Transaction} tx
   */

  setAlgoTransaction(tx: algosdk.Transaction): void {
    this._algoTransaction = tx;
  }

  /**
   * Get underlaying algo transaction.
   *
   * @returns {algosdk.Transaction}
   */

  getAlgoTransaction(): algosdk.Transaction | undefined {
    return this._algoTransaction;
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
  toBroadcastFormat(): algosdk.EncodedTransaction {
    if (!this._signedTransaction) {
      throw new ParseTransactionError('Transaction not signed');
    }
    return this._signedTransaction.txn;
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const result: TxData = {
      id: this._algoTransaction.txID(),
      from: algosdk.encodeAddress(this._algoTransaction.from.publicKey),
      fee: this._algoTransaction.fee,
      firstRound: this._algoTransaction.firstRound,
      lastRound: this._algoTransaction.lastRound,
      amount: this._algoTransaction.amount.toString(),
      note: this._algoTransaction.note,
    };
    if (this.type === TransactionType.Send) {
      result.to = algosdk.encodeAddress(this._algoTransaction.to.publicKey);
    }
    return result;
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this._algoTransaction) {
      return;
    }
    if (this.type === TransactionType.Send) {
      this._outputs = [
        {
          address: algosdk.encodeAddress(this._algoTransaction.to.publicKey),
          value: this._algoTransaction.amount.toString(),
          coin: this._coinConfig.name,
        },
      ];

      this._inputs = [
        {
          address: algosdk.encodeAddress(this._algoTransaction.from.publicKey),
          value: this._algoTransaction.amount.toString(),
          coin: this._coinConfig.name,
        },
      ];
    }
  }
}
