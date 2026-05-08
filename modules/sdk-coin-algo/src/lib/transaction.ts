import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import {
  BaseTransaction,
  TransactionType,
  BaseKey,
  InvalidTransactionError,
  InvalidKey,
  SigningError,
} from '@bitgo/sdk-core';
import utils from './utils';
import { KeyPair } from './keyPair';
import { TxData } from './ifaces';

export class Transaction extends BaseTransaction {
  private _algoTransaction?: algosdk.Transaction;
  private _signedTransaction?: Uint8Array;
  private _numberOfRequiredSigners: number;
  private _sender: string;
  private _signers: string[];
  private _signedBy: string[];

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
    const signKey = Buffer.from(keyPair.getSigningKey()).toString('hex');
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

    // Check if it is a signed or unsigned tx.
    // If unsigned, sign it using first keypair and then append next signatures.
    // If signed, appending next signatures.
    let signedTx = this._signedTransaction
      ? this._signedTransaction
      : algosdk.signMultisigTransaction(this._algoTransaction, multiSigOptions, keyPair.shift()!.getSigningKey()).blob;

    keyPair.forEach((kp) => {
      signedTx = algosdk.appendSignMultisigTransaction(signedTx, multiSigOptions, kp.getSigningKey()).blob;
    });
    this._signedTransaction = signedTx;
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

  get signers(): string[] {
    return this._signers;
  }

  set signedBy(signer: string[]) {
    this._signedBy = signer;
  }

  get signedBy(): string[] {
    return this._signedBy;
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

  estimateSize(): number {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }

    return this._algoTransaction.estimateSize();
  }

  /** @inheritdoc */
  toBroadcastFormat(): Uint8Array {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._signedTransaction && this._signedTransaction.length > 0) {
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
      type: this._algoTransaction.type?.toString(),
      from: algosdk.encodeAddress(this._algoTransaction.from.publicKey),
      fee: this._algoTransaction.fee,
      firstRound: this._algoTransaction.firstRound,
      lastRound: this._algoTransaction.lastRound,
      note: this._algoTransaction.note,
      tokenId: this._algoTransaction?.assetIndex,
      genesisID: this._algoTransaction.genesisID,
      genesisHash: this._algoTransaction.genesisHash.toString('base64'),
    };
    if (this._algoTransaction.closeRemainderTo) {
      result.closeRemainderTo = algosdk.encodeAddress(this._algoTransaction.closeRemainderTo.publicKey);
    }
    if (this.type === TransactionType.Send) {
      result.to = algosdk.encodeAddress(this._algoTransaction.to.publicKey);
      result.amount = this._algoTransaction.amount.toString();
    }
    if (this.type === TransactionType.WalletInitialization) {
      if (!this._algoTransaction.nonParticipation) {
        if (
          this._algoTransaction.voteKey &&
          this._algoTransaction.selectionKey &&
          this._algoTransaction.voteFirst &&
          this._algoTransaction.voteLast &&
          this._algoTransaction.voteKeyDilution
        ) {
          result.voteKey = this._algoTransaction.voteKey.toString('base64');
          result.selectionKey = this._algoTransaction.selectionKey.toString('base64');
          result.voteFirst = this._algoTransaction.voteFirst;
          result.voteLast = this._algoTransaction.voteLast;
          result.voteKeyDilution = this._algoTransaction.voteKeyDilution;
          if (this._algoTransaction.stateProofKey) {
            result.stateProofKey = this._algoTransaction.stateProofKey.toString('base64');
          }
        }
      } else {
        result.nonParticipation = this._algoTransaction.nonParticipation;
      }
    }
    if (result.type === 'axfer' && result.to && result.amount) {
      result.txType = utils.getTokenTxType(result.amount, result.from, result.to, result.closeRemainderTo);
      result.tokenName = this._coinConfig.suffix;
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
