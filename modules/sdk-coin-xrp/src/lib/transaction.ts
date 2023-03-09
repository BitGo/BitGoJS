import * as xrpl from 'xrpl';
import _ from 'lodash';

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  SigningError,
  TransactionType,
  TransactionExplanation as BaseTransactionExplanation,
} from '@bitgo/sdk-core';
import XrpUtils from './utils';
import { XrpAllowedTransactionTypes } from './enum';
import { KeyPair } from './keyPair';
import {
  AccountSetTransactionExplanation,
  SignerListSetTransactionExplanation,
  TransactionExplanation,
  TxData,
} from './iface';
import { Signer } from 'xrpl/dist/npm/models/common';
import BigNumber from 'bignumber.js';

/**
 * XRP transaction.
 */
export class Transaction extends BaseTransaction {
  // XRP specific fields
  protected _xrpTransaction: xrpl.Transaction;
  protected _xrpInternalTxType: XrpAllowedTransactionTypes;
  protected _isMultiSig: boolean;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get xrpTransaction(): xrpl.Transaction {
    return this._xrpTransaction;
  }

  set xrpTransaction(tx: xrpl.Transaction) {
    this._xrpTransaction = tx;
  }

  canSign(key: BaseKey): boolean {
    if (!XrpUtils.isValidPrivateKey(key.key)) {
      return false;
    }
    return true;
  }

  toJson(): TxData {
    if (!this._xrpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }

    const txData: TxData = {
      from: this._xrpTransaction.Account,
      isMultiSig: this._isMultiSig,
      transactionType: this._xrpInternalTxType,
      id: this._id,
      fee: this._xrpTransaction.Fee,
      sequence: this._xrpTransaction.Sequence,
      lastLedgerSequence: this._xrpTransaction.LastLedgerSequence,
      flags: this._xrpTransaction.Flags as number,
      signingPubKey: this._xrpTransaction.SigningPubKey,
      signers: this._xrpTransaction.Signers,
      txnSignature: this._xrpTransaction.TxnSignature,
    };

    if (this._xrpTransaction.SigningPubKey === '' && !_.isEmpty(this._xrpTransaction.Signers)) {
      txData.isMultiSig = true;
    }
    if (this._xrpTransaction.SigningPubKey && XrpUtils.isValidPublicKey(this._xrpTransaction.SigningPubKey)) {
      txData.isMultiSig = false;
    }

    switch (this._xrpTransaction.TransactionType) {
      case XrpAllowedTransactionTypes.Payment:
        txData.destination = this._xrpTransaction.Destination;
        txData.destinationTag = this._xrpTransaction.DestinationTag;
        if (_.isString(this._xrpTransaction.Amount)) {
          txData.amount = this._xrpTransaction.Amount;
        } else {
          // Amount is an object
          throw new InvalidTransactionError('Invalid amount');
        }
        return txData;

      case XrpAllowedTransactionTypes.AccountSet:
        txData.setFlag = this._xrpTransaction.SetFlag;
        txData.messageKey = this._xrpTransaction.MessageKey;
        return txData;

      case XrpAllowedTransactionTypes.SignerListSet:
        txData.signerQuorum = this._xrpTransaction.SignerQuorum;
        txData.signerEntries = this._xrpTransaction.SignerEntries;
        return txData;

      default:
        throw new InvalidTransactionError('Invalid transaction type');
    }
  }

  getSignablePayload(): xrpl.Transaction {
    if (!this._xrpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return _.omit(this._xrpTransaction, ['TxnSignature', 'Signers', 'SigningPubKey']) as xrpl.Transaction;
  }

  sign(keyPair: KeyPair | KeyPair[]): void {
    if (!this._xrpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (!this._xrpTransaction.Fee) {
      throw new InvalidTransactionError('Missing fee');
    }
    if (!this._xrpTransaction.Sequence) {
      throw new InvalidTransactionError('Missing sequence');
    }
    if (!this._xrpTransaction.Flags === undefined) {
      throw new InvalidTransactionError('Missing flags');
    }
    if (_.isEmpty(keyPair)) {
      return;
    }

    const keyPairs = keyPair instanceof Array ? keyPair : [keyPair];
    for (const kp of keyPairs) {
      const { pub, prv } = kp.getKeys();
      if (!prv) {
        throw new SigningError('Missing private key');
      }

      if (this._isMultiSig === false && this._xrpTransaction.TxnSignature) {
        throw new SigningError('Transaction has already been signed');
      }
      const signablePayload = this.getSignablePayload();

      const xrpWallet = new xrpl.Wallet(pub, prv);
      const signedTx = xrpWallet.sign(signablePayload, this._isMultiSig);
      const xrpSignedTx = xrpl.decode(signedTx.tx_blob);
      xrpl.validate(xrpSignedTx);

      if (this._isMultiSig === false) {
        xrpWallet.verifyTransaction(signedTx.tx_blob);
        this._xrpTransaction = xrpSignedTx as unknown as xrpl.Transaction;
        this._id = signedTx.hash;
      }

      if (this._isMultiSig === true) {
        if (!xrpSignedTx.Signers || !_.isArray(xrpSignedTx.Signers)) {
          throw new SigningError('Missing or invalid signers');
        }
        const sortedSigners = this.concatAndSortSigners(this._xrpTransaction.Signers || [], xrpSignedTx.Signers);
        this._xrpTransaction = xrpSignedTx as unknown as xrpl.Transaction;
        this._xrpTransaction.Signers = sortedSigners;
        this._id = this.calculateIdFromRawTx(xrpl.encode(this._xrpTransaction));
      }
    }
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._xrpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return xrpl.encode(this._xrpTransaction);
  }

  explainTransaction(): TransactionExplanation {
    switch (this._xrpInternalTxType) {
      case XrpAllowedTransactionTypes.Payment:
        return this.explainPaymentTransaction();
      case XrpAllowedTransactionTypes.AccountSet:
        return this.explainAccountSetTransaction();
      case XrpAllowedTransactionTypes.SignerListSet:
        return this.explainSignerListSetTransaction();
      default:
        throw new Error('Unsupported transaction type');
    }
  }

  private explainPaymentTransaction(): BaseTransactionExplanation {
    const tx = this._xrpTransaction as xrpl.Payment;
    const address = XrpUtils.normalizeAddress({ address: tx.Destination, destinationTag: tx.DestinationTag });
    const amount = _.isString(tx.Amount) ? tx.Amount : 0;

    return {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'],
      id: this._id,
      changeOutputs: [],
      outputAmount: amount,
      changeAmount: 0,
      outputs: [
        {
          address,
          amount,
        },
      ],
      fee: {
        fee: tx.Fee,
        feeRate: null,
      },
    } as any;
  }

  private explainAccountSetTransaction(): AccountSetTransactionExplanation {
    const tx = this._xrpTransaction as xrpl.AccountSet;
    return {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'accountSet'],
      id: this._id,
      changeOutputs: [],
      outputAmount: 0,
      changeAmount: 0,
      outputs: [],
      fee: {
        fee: tx.Fee,
        feeRate: null,
      },
      accountSet: {
        messageKey: tx.MessageKey,
        setFlag: tx.SetFlag,
      },
    } as any;
  }

  private explainSignerListSetTransaction(): SignerListSetTransactionExplanation {
    const tx = this._xrpTransaction as xrpl.SignerListSet;
    return {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'signerListSet'],
      id: this._id,
      changeOutputs: [],
      outputAmount: 0,
      changeAmount: 0,
      outputs: [],
      fee: {
        fee: tx.Fee,
        feeRate: null,
      },
      signerListSet: {
        signerQuorum: tx.SignerQuorum,
        signerEntries: tx.SignerEntries,
      },
    } as any;
  }

  private calculateIdFromRawTx(rawTransaction: string): string {
    let id: string;
    // hashes ids are different for signed and unsigned tx
    // first we try to get the hash id as if it is signed, will throw if its not
    try {
      id = xrpl.hashes.hashSignedTx(rawTransaction);
    } catch (e) {
      id = xrpl.hashes.hashTx(rawTransaction);
    }
    return id;
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  setMultiSigValue(isMultiSig: boolean): void {
    this._isMultiSig = isMultiSig;
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    let txHex = rawTransaction;
    if (!XrpUtils.isValidHex(rawTransaction)) {
      try {
        txHex = xrpl.encode(JSON.parse(rawTransaction));
      } catch (e) {
        throw new InvalidTransactionError('Invalid transaction');
      }
    }
    XrpUtils.validateRawTransaction(txHex);

    this._xrpTransaction = xrpl.decode(txHex) as unknown as xrpl.Transaction;
    if (!XrpUtils.isValidTransactionType(this._xrpTransaction.TransactionType)) {
      throw new InvalidTransactionError('Invalid transaction type, got: ' + this._xrpTransaction.TransactionType);
    }
    this._xrpInternalTxType = this._xrpTransaction.TransactionType as XrpAllowedTransactionTypes;
    if (this._xrpTransaction.SigningPubKey && this._xrpTransaction.SigningPubKey !== '') {
      this._isMultiSig = false;
    }
    if (
      this._xrpTransaction.SigningPubKey === '' &&
      this._xrpTransaction.Signers &&
      this._xrpTransaction.Signers.length > 0
    ) {
      this._isMultiSig = true;
    }
    this._id = this.calculateIdFromRawTx(txHex);

    switch (this._xrpInternalTxType) {
      case XrpAllowedTransactionTypes.SignerListSet:
        this.setTransactionType(TransactionType.WalletInitialization);
        break;
      case XrpAllowedTransactionTypes.AccountSet:
        this.setTransactionType(TransactionType.AccountUpdate);
        break;
      case XrpAllowedTransactionTypes.Payment:
        this.setTransactionType(TransactionType.Send);
    }
    this.loadInputsAndOutputs();
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this._xrpTransaction) {
      return;
    }
    if (this._xrpTransaction.TransactionType === XrpAllowedTransactionTypes.Payment) {
      let value: string, coin: string;
      const { Account, Destination, Amount, DestinationTag } = this._xrpTransaction;
      if (_.isString(Amount)) {
        value = Amount;
        coin = this._coinConfig.name;
      } else {
        value = Amount.value;
        coin = Amount.currency;
      }
      this.inputs.push({
        address: Account,
        value,
        coin,
      });
      this.outputs.push({
        address: XrpUtils.normalizeAddress({ address: Destination, destinationTag: DestinationTag }),
        value,
        coin,
      });
    }
  }

  /**
   * Groups and sorts the signers by account.
   * @param {Signer[]}signers1 - The first set of signers.
   * @param {Signer[]}signers2 - The second set of signers.
   * @returns The grouped and sorted signers.
   **/
  private concatAndSortSigners(signers1: Signer[], signers2: Signer[]): Signer[] {
    return signers1
      .concat(signers2)
      .sort((signer1, signer2) => this.compareSignersByAccount(signer1.Signer.Account, signer2.Signer.Account));
  }

  /**
   * If presented in binary form, the Signers array must be sorted based on
   * the numeric value of the signer addresses, with the lowest value first.
   * (If submitted as JSON, the submit_multisigned method handles this automatically.)
   * https://xrpl.org/multi-signing.html.
   *
   * @param left - A Signer to compare with.
   * @param right - A second Signer to compare with.
   * @returns 1 if left \> right, 0 if left = right, -1 if left \< right, and null if left or right are NaN.
   */
  private compareSignersByAccount(address1: string, address2: string): number {
    const addressBN1 = this.addressToBigNumber(address1);
    const addressBN2 = this.addressToBigNumber(address2);
    return addressBN1.comparedTo(addressBN2);
  }

  private addressToBigNumber(address: string): BigNumber {
    const hex = Buffer.from(xrpl.decodeAccountID(address)).toString('hex');
    const numberOfBitsInHex = 16;
    return new BigNumber(hex, numberOfBitsInHex);
  }
}
