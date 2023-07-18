import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as Long from 'long';
import { proto } from '@hashgraph/proto';
import { DuplicateMethodError, InvalidParameterValueError } from '@bitgo/sdk-core';
import { Recipient } from './iface';
import { TransferBuilder } from './transferBuilder';
import { Transaction } from './transaction';
import { isValidAddress, isValidAmount, stringifyAccountId, buildHederaAccountID } from './utils';
import { BigNumber } from 'bignumber.js';

export class CoinTransferBuilder extends TransferBuilder {
  // @deprecated Use _recipients field instead
  private _toAddress: string;
  // @deprecated Use _recipients field instead
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.transfers = this.buildTransferData();
    return await super.buildImplementation();
  }

  private buildTransferData(): proto.ITransferList {
    let totalSend = new BigNumber(0);
    const accountAmounts: proto.IAccountAmount[] = [
      {
        accountID: buildHederaAccountID(this._source.address),
        amount: Long.fromInt(0),
      }, // sender
    ];
    // add recipients and update send amount
    this._recipients.forEach((recipient) => {
      accountAmounts.push(
        { accountID: buildHederaAccountID(recipient.address), amount: Long.fromString(recipient.amount) } // recipient
      );
      totalSend = totalSend.plus(recipient.amount);
    });
    accountAmounts[0].amount = Long.fromString(totalSend.toString()).negate(); // update sender send amount

    return {
      accountAmounts: accountAmounts,
    };
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
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
        this.send({
          address: stringifyAccountId(transferData.accountID!),
          amount: amount.toString(),
        });
      }
    });
  }

  // region Transfer fields

  // Currently works for one recipient by using exatcly one of to + amount or send function
  /**
   * @deprecated - Use the send method instead
   *
   * Set the destination address where the funds will be sent,
   * it may take the format `'<shard>.<realm>.<account>'` or `'<account>'`
   *
   * @param {string} address - The address to transfer funds to
   * @returns {TransferBuilder} - The builder with the new parameter set
   */
  to(address: string): this {
    if (this._recipients.length > 0) {
      throw new DuplicateMethodError('Invalid method: send already used');
    }
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid address');
    }
    this._toAddress = address;
    return this;
  }

  /**
   * @deprecated - Use the send method instead
   *
   * Set the amount to be transferred
   *
   * @param {string} amount - Amount to transfer in tinyBars (there are 100,000,000 tinyBars in one Hbar)
   * @returns {TransferBuilder} - The builder with the new parameter set
   */
  amount(amount: string): this {
    if (this._recipients.length > 0) {
      throw new DuplicateMethodError('Invalid method: send already used');
    }
    if (!isValidAmount(amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._amount = amount;
    return this;
  }

  /** @inheritdoc */
  send(recipient: Recipient): this {
    if (this._amount || this._toAddress) {
      throw new DuplicateMethodError('Invalid method: to or amount already used');
    }
    if (recipient.tokenName) {
      throw new InvalidParameterValueError('Invalid token name must be empty');
    }
    return super.send(recipient);
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateMandatoryFields(): void {
    if (this._toAddress && this._amount) {
      this._recipients.push({
        address: this._toAddress,
        amount: this._amount,
      });
    }
    super.validateMandatoryFields();
  }
  // endregion
}
