import _ from 'lodash';
import * as xrpl from 'xrpl';

import {
  BaseKey,
  BaseTransaction,
  TransactionExplanation as BaseTransactionExplanation,
  InvalidTransactionError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';

import BigNumber from 'bignumber.js';
import { Signer } from 'xrpl';
import {
  AccountSetTransactionExplanation,
  SignerListSetTransactionExplanation,
  TransactionExplanation,
  TxData,
  XrpTransaction,
  XrpTransactionType,
} from './iface';
import { KeyPair } from './keyPair';

/**
 * XRP transaction.
 */
export class Transaction extends BaseTransaction {
  // XRP specific fields
  protected _xrpTransaction: XrpTransaction;
  protected _isMultiSig: boolean;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get xrpTransaction(): XrpTransaction {
    return this._xrpTransaction;
  }

  set xrpTransaction(tx: XrpTransaction) {
    this._xrpTransaction = tx;
  }

  canSign(key: BaseKey): boolean {
    if (!utils.isValidPrivateKey(key.key)) {
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
      transactionType: this._xrpTransaction.TransactionType as XrpTransactionType,
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
    if (this._xrpTransaction.SigningPubKey && utils.isValidPublicKey(this._xrpTransaction.SigningPubKey)) {
      txData.isMultiSig = false;
    }

    switch (this._xrpTransaction.TransactionType) {
      case XrpTransactionType.Payment:
        txData.destination = this._xrpTransaction.Destination;
        txData.destinationTag = this._xrpTransaction.DestinationTag;
        if (
          typeof this._xrpTransaction.Amount === 'string' ||
          utils.isIssuedCurrencyAmount(this._xrpTransaction.Amount)
        ) {
          txData.amount = this._xrpTransaction.Amount;
        } else {
          throw new InvalidTransactionError('Invalid amount');
        }
        return txData;

      case XrpTransactionType.AccountSet:
        txData.setFlag = this._xrpTransaction.SetFlag;
        txData.messageKey = this._xrpTransaction.MessageKey;
        return txData;

      case XrpTransactionType.SignerListSet:
        txData.signerQuorum = this._xrpTransaction.SignerQuorum;
        txData.signerEntries = this._xrpTransaction.SignerEntries;
        return txData;

      default:
        throw new InvalidTransactionError('Invalid transaction type');
    }
  }

  getSignablePayload(): XrpTransaction {
    if (!this._xrpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return _.omit(this._xrpTransaction, ['TxnSignature', 'Signers', 'SigningPubKey']) as XrpTransaction;
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
    if (!this._xrpTransaction.Flags) {
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
        this._xrpTransaction = xrpSignedTx as unknown as XrpTransaction;
        this._id = signedTx.hash;
      }

      if (this._isMultiSig === true) {
        if (!xrpSignedTx.Signers || !_.isArray(xrpSignedTx.Signers)) {
          throw new SigningError('Missing or invalid signers');
        }
        const sortedSigners = this.concatAndSortSigners(this._xrpTransaction.Signers || [], xrpSignedTx.Signers);
        this._xrpTransaction = xrpSignedTx as unknown as XrpTransaction;
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
    switch (this._xrpTransaction.TransactionType) {
      case XrpTransactionType.Payment:
        return this.explainPaymentTransaction();
      case XrpTransactionType.AccountSet:
        return this.explainAccountSetTransaction();
      case XrpTransactionType.SignerListSet:
        return this.explainSignerListSetTransaction();
      default:
        throw new Error('Unsupported transaction type');
    }
  }

  private explainPaymentTransaction(): BaseTransactionExplanation {
    const tx = this._xrpTransaction as xrpl.Payment;
    const address = utils.normalizeAddress({ address: tx.Destination, destinationTag: tx.DestinationTag });
    const amount = _.isString(tx.Amount) ? tx.Amount : 0;

    return {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'],
      id: this._id as string,
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
        fee: tx.Fee as string,
        feeRate: undefined,
      },
    };
  }

  private explainAccountSetTransaction(): AccountSetTransactionExplanation {
    const tx = this._xrpTransaction as xrpl.AccountSet;
    return {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'accountSet'],
      id: this._id as string,
      changeOutputs: [],
      outputAmount: 0,
      changeAmount: 0,
      outputs: [],
      fee: {
        fee: tx.Fee as string,
        feeRate: undefined,
      },
      accountSet: {
        messageKey: tx.MessageKey,
        setFlag: tx.SetFlag as xrpl.AccountSetAsfFlags,
      },
    };
  }

  private explainSignerListSetTransaction(): SignerListSetTransactionExplanation {
    const tx = this._xrpTransaction as xrpl.SignerListSet;
    return {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'signerListSet'],
      id: this._id as string,
      changeOutputs: [],
      outputAmount: 0,
      changeAmount: 0,
      outputs: [],
      fee: {
        fee: tx.Fee as string,
        feeRate: undefined,
      },
      signerListSet: {
        signerQuorum: tx.SignerQuorum,
        signerEntries: tx.SignerEntries as xrpl.SignerEntry[],
      },
    };
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
    if (!utils.isValidHex(rawTransaction)) {
      try {
        txHex = xrpl.encode(JSON.parse(rawTransaction));
      } catch (e) {
        throw new InvalidTransactionError('Invalid transaction');
      }
    }
    utils.validateRawTransaction(txHex);

    this._xrpTransaction = xrpl.decode(txHex) as unknown as XrpTransaction;
    if (!XrpTransactionType[this._xrpTransaction.TransactionType]) {
      throw new InvalidTransactionError('Unsupported transaction type, got: ' + this._xrpTransaction.TransactionType);
    }
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

    switch (this._xrpTransaction.TransactionType) {
      case XrpTransactionType.SignerListSet:
        this.setTransactionType(TransactionType.WalletInitialization);
        break;
      case XrpTransactionType.AccountSet:
        this.setTransactionType(TransactionType.AccountUpdate);
        break;
      case XrpTransactionType.Payment:
        if (utils.isIssuedCurrencyAmount(this._xrpTransaction.Amount)) {
          this.setTransactionType(TransactionType.SendToken);
        } else {
          this.setTransactionType(TransactionType.Send);
        }
        break;
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
    if (this._xrpTransaction.TransactionType === XrpTransactionType.Payment) {
      let value: string;
      const { Account, Destination, Amount, DestinationTag } = this._xrpTransaction;
      if (typeof Amount === 'string') {
        value = Amount;
      } else {
        value = Amount.value;
      }
      const coin = this._coinConfig.name;
      this.inputs.push({
        address: Account,
        value,
        coin,
      });
      this.outputs.push({
        address: utils.normalizeAddress({ address: Destination, destinationTag: DestinationTag }),
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
