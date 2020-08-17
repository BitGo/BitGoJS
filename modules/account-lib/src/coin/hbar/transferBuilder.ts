import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import Long from 'long';
import { AccountId } from '@hashgraph/sdk';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BuildTransactionError, InvalidParameterValueError, SigningError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAddress, isValidAmount, stringifyAccountId } from './utils';
import { TransactionType } from '../baseCoin';

export class TransferBuilder extends TransactionBuilder {
  private _txBodyData: proto.CryptoTransferTransactionBody;
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
        { accountID: this.buildAccountData(this._source.address), amount: Long.fromString(this._amount).negate() }, // sender
        { accountID: this.buildAccountData(this._toAddress), amount: Long.fromString(this._amount) }, // recipient
      ],
    };
  }

  private buildAccountData(address: string): proto.AccountID {
    const accountData = new AccountId(address);
    return new proto.AccountID({
      accountNum: accountData.account,
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
   * The negative amount represents the source account so it's ignored.
   *
   * @param {proto.IAccountAmount[]} transfers array of objects which contains accountID and transferred amount
   */
  protected initTransfers(transfers: proto.IAccountAmount[]): void {
    transfers.forEach(transferData => {
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

  //region Transfer fields
  /**
   * Set the destination address where the funds will be sent,
   * it may take the format `'<shard>.<realm>.<account>'` or `'<account>'`
   *
   * @param {string} address the address to transfer funds to
   * @returns {TransferBuilder} the builder with the new parameter set
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
   * @param {string} amount amount to transfer in tinyBars (there are 100,000,000 tinyBars in one Hbar)
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  amount(amount: string): this {
    if (!isValidAmount(amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._amount = amount;
    return this;
  }

  //endregion

  //region Validators
  validateMandatoryFields(): void {
    if (this._toAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing to');
    }
    if (this._amount === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing amount');
    }
    super.validateMandatoryFields();
  }
  //endregion
}
