import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as Long from 'long';
import * as proto from '@hashgraph/proto';
import { InvalidParameterValueError } from '@bitgo/sdk-core';
import { Recipient } from './iface';
import { TransferBuilder } from './transferBuilder';
import { Transaction } from './transaction';
import { stringifyAccountId, buildHederaAccountID } from './utils';
import { BigNumber } from 'bignumber.js';

export class CoinTransferBuilder extends TransferBuilder {
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
    const accountAmounts: proto.AccountAmount[] = [
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

  /** @inheritdoc */
  send(recipient: Recipient): this {
    if (recipient.tokenName) {
      throw new InvalidParameterValueError('Invalid token name must be empty');
    }
    return super.send(recipient);
  }
  // endregion
}
