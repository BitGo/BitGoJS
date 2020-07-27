import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import Long from 'long';
import { AccountId } from '@hashgraph/sdk';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { NotImplementedError, BuildTransactionError, InvalidParameterValueError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAddress, isValidAmount } from './utils';

export class TransferBuilder extends TransactionBuilder {
  private _txBodyData: proto.CryptoTransferTransactionBody;
  private _toAddress: string;
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBody = new proto.TransactionBody();
    this._txBody.transactionValidDuration = this._duration;
    this._txBodyData = new proto.CryptoTransferTransactionBody();
    this._txBody.cryptoTransfer = this._txBodyData;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.transfers = this.buildTransferData();
    // TODO: Add signature to the tx body
    return super.buildImplementation();
  }

  private buildTransferData(): proto.ITransferList {
    return { accountAmounts: [{ accountID: this.buildRecipientData(), amount: Long.fromString(this._amount) }] };
  }

  private buildRecipientData(): proto.AccountID {
    const accountData = new AccountId(this._toAddress);
    return new proto.AccountID({
      accountNum: accountData.account,
      realmNum: accountData.realm,
      shardNum: accountData.shard,
    });
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('signImplementation not implemented');
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
   * @param {string} amount amount to transfer in tinyBars
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
