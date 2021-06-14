import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError, InvalidKey, SigningError } from '../baseCoin/errors';
import utils from './utils';
import { KeyPair } from './keyPair';
import { TxData } from './ifaces';

export class Transaction extends BaseTransaction {
  private _algoTransaction?: algosdk.Transaction;
  private _signedTransaction?: Uint8Array;
  private _numberOfRequiredSigners: number;
  private _sender: string;
  private _signers: string[];

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._numberOfRequiredSigners = 0;
    this._signers = [];
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

  sender(address: string): void {
    this._sender = address;
  }

  /**
   * Signs transaction.
   *
   * @param {KeyPair} keyPair Signer keys.
   */
  sign(keyPair: KeyPair[]): void {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._numberOfRequiredSigners === 1) {
      this.signSingle(keyPair[0]);
    } else if (this._numberOfRequiredSigners > 1) {
      this.signMultiSig(keyPair);
    }
  }

  /**
   * Signs transaction.
   *
   * @param {KeyPair} keyPair Signer keys.
   */
  private signSingle(keyPair: KeyPair): void {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const signKey = keyPair.getKeys().prv + keyPair.getKeys().pub;
    if (signKey) {
      this._signedTransaction = algosdk.signTransaction(this._algoTransaction, utils.toUint8Array(signKey)).blob;
    } else {
      throw new InvalidKey('Private key undefined');
    }
  }

  /**
   * Signs multisig transaction.
   *
   * @param {KeyPair} keyPair Signers keys.
   */
  private signMultiSig(keyPair: KeyPair[]): void {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._signers.length === 0) {
      throw new SigningError('Signers not specified for multisig');
    }
    if (keyPair.length === 0) {
      throw new SigningError('Keypair not specified for multisig');
    }
    const multiSigOptions = {
      version: 1,
      threshold: this._numberOfRequiredSigners,
      addrs: this._signers,
    };
    const msigAddress = algosdk.multisigAddress(multiSigOptions);
    this._algoTransaction.from = algosdk.decodeAddress(msigAddress);

    let signature;
    if (this._signedTransaction) {
      signature = this._signedTransaction;
    } else {
      const key = keyPair[0].getKeys();
      keyPair = keyPair.slice(1);
      signature = algosdk.signMultisigTransaction(
        this._algoTransaction,
        multiSigOptions,
        utils.toUint8Array(key.prv + key.pub),
      ).blob;
    }
    keyPair.forEach((kp) => {
      const key = kp.getKeys();
      signature = algosdk.appendSignMultisigTransaction(
        signature,
        multiSigOptions,
        utils.toUint8Array(key.prv + key.pub),
      ).blob;
    });
    this._signedTransaction = signature;
  }

  set signedTransaction(txn: Uint8Array) {
    this._signedTransaction = txn;
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

  set signers(addrs: string[]) {
    this._signers = addrs;
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
  toBroadcastFormat(): Uint8Array {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._signedTransaction) {
      return this._signedTransaction;
    } else {
      return algosdk.encodeUnsignedTransaction(this._algoTransaction);
    }
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
      note: this._algoTransaction.note,
    };
    if (this.type === TransactionType.Send) {
      result.to = algosdk.encodeAddress(this._algoTransaction.to.publicKey);
      result.amount = this._algoTransaction.amount.toString();
    }
    if (this.type === TransactionType.KeyRegistration) {
      result.voteKey = this._algoTransaction.voteKey.toString('base64');
      result.selectionKey = this._algoTransaction.selectionKey.toString('base64');
      result.voteFirst = this._algoTransaction.voteFirst;
      result.voteLast = this._algoTransaction.voteLast;
      result.voteKeyDilution = this._algoTransaction.voteKeyDilution;
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
