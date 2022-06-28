import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as Long from 'long';
import { AccountId } from '@hashgraph/sdk';
import * as proto from '@hashgraph/proto';
import {
  BaseKey,
  BuildTransactionError,
  InvalidParameterValueError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAddress, isValidAmount, stringifyAccountId } from './utils';

export class TransferBuilder extends TransactionBuilder {
  private readonly _txBodyData: proto.CryptoTransferTransactionBody;
  private _toAddress: string;
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBodyData = new proto.CryptoTransferTransactionBody();
    this._txBody.cryptoTransfer = this._txBodyData;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.transfers = this.buildTransferData();
    this.transaction.setTransactionType(TransactionType.Send);
    return await super.buildImplementation();
  }

  private buildTransferData(): proto.ITransferList {
    return {
      accountAmounts: [
        {
          accountID: TransferBuilder.buildAccountData(this._source.address),
          amount: Long.fromString(this._amount).negate(),
        }, // sender
        { accountID: TransferBuilder.buildAccountData(this._toAddress), amount: Long.fromString(this._amount) }, // recipient
      ],
    };
  }

  static buildAccountData(address: string): proto.AccountID {
    const accountData = AccountId.fromString(address);
    return new proto.AccountID({
      accountNum: accountData.num,
      realmNum: accountData.realm,
      shardNum: accountData.shard,
    });
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.Send);
    const transferData = tx.txBody.cryptoTransfer;
    if (transferData && transferData.transfers && transferData.transfers.accountAmounts) {
      this.initTransfers(transferData.transfers.accountAmounts);
    }
  }

  /**
   * Initialize the transfer specific data, getting the recipient account
   * represented by the element with a positive amount on the transfer element.
   * The negative amount represents the source account, so it's ignored.
   *
   * @param {proto} transfers - Array of objects which contains accountID and transferred amount
   */
  protected initTransfers(transfers: proto.IAccountAmount[]): void {
    transfers.forEach((transferData) => {
      const amount = Long.fromValue(transferData.amount!);
      if (amount.isPositive()) {
        this.to(stringifyAccountId(transferData.accountID!));
        this.amount(amount.toString());
      }
    });
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._multiSignerKeyPairs.length >= DEFAULT_M) {
      throw new SigningError('A maximum of ' + DEFAULT_M + ' can sign the transaction.');
    }
    return super.signImplementation(key);
  }

  // region Transfer fields
  /**
   * Set the destination address where the funds will be sent,
   * it may take the format `'<shard>.<realm>.<account>'` or `'<account>'`
   *
   * @param {string} address - The address to transfer funds to
   * @returns {TransferBuilder} - The builder with the new parameter set
   */
  to(address: string): this {
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid address');
    }
    this._toAddress = address;
    return this;
  }

  /**
   * Set the amount to be transferred
   *
   * @param {string} amount - Amount to transfer in tinyBars (there are 100,000,000 tinyBars in one Hbar)
   * @returns {TransferBuilder} - The builder with the new parameter set
   */
  amount(amount: string): this {
    if (!isValidAmount(amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._amount = amount;
    return this;
  }

  // endregion

  // region Validators
  validateMandatoryFields(): void {
    if (this._toAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing to');
    }
    if (this._amount === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing amount');
    }
    super.validateMandatoryFields();
  }
  // endregion
}
