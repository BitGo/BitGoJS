import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as Long from 'long';
import { proto } from '@hashgraph/proto';
import { BuildTransactionError, InvalidParameterValueError } from '@bitgo/sdk-core';
import { Recipient } from './iface';
import { TransferBuilder } from './transferBuilder';
import { Transaction } from './transaction';
import {
  buildHederaAccountID,
  buildHederaTokenID,
  getHederaTokenIdFromName,
  getHederaTokenNameFromId,
  isTokenTransfer,
  stringifyAccountId,
  stringifyTokenId,
} from './utils';
import { BigNumber } from 'bignumber.js';

export class TokenTransferBuilder extends TransferBuilder {
  private _tokenName; // currently only support 1 token/transfer

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.tokenTransfers = this.buildTokenTransferData(); // set to list by the contract
    return await super.buildImplementation();
  }

  private buildTokenTransferData(): proto.ITokenTransferList[] {
    let tokenTransferAmount = new BigNumber(0); // total send amount for each token
    const tokenId = getHederaTokenIdFromName(this._tokenName);
    const tokenTransferData: proto.IAccountAmount[] = [
      {
        accountID: buildHederaAccountID(this._source.address),
        amount: Long.fromInt(0),
      },
    ];

    this._recipients.forEach((recipient) => {
      tokenTransferAmount = tokenTransferAmount.plus(recipient.amount);
      tokenTransferData.push(
        { accountID: buildHederaAccountID(recipient.address), amount: Long.fromString(recipient.amount) } // recipient
      );
    });
    tokenTransferData[0].amount = Long.fromString(tokenTransferAmount.toString()).negate(); // update sender send amount

    return [
      {
        token: buildHederaTokenID(tokenId!),
        transfers: tokenTransferData,
      },
    ];
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const transferData = tx.txBody.cryptoTransfer!;
    if (isTokenTransfer(transferData)) {
      this.initTokenTransfers(transferData.tokenTransfers!);
    }
  }

  /**
   * Initialize the transfer specific data, getting the recipient account
   * represented by the element with a positive amount on the transfer element.
   * The negative amount represents the source account so it's ignored.
   *
   * @param {proto.IAccountAmount[]} transfers array of objects which contains accountID and transferred amount
   */
  protected initTokenTransfers(tokenTransfers: proto.ITokenTransferList[]): void {
    tokenTransfers.forEach((tokenTransfer: proto.ITokenTransferList) => {
      if (!tokenTransfer.token) {
        throw new BuildTransactionError('Invalid transaction: missing token id');
      }
      if (!tokenTransfer.transfers) {
        throw new BuildTransactionError('Invalid transaction: missing transfer data');
      }

      const token = getHederaTokenNameFromId(stringifyTokenId(tokenTransfer.token!));
      if (!token) {
        throw new BuildTransactionError('Invalid transaction: invalid token id');
      }
      tokenTransfer.transfers.forEach((transferData) => {
        const amount = Long.fromValue(transferData.amount!);
        if (amount.isPositive()) {
          this.send({
            address: stringifyAccountId(transferData.accountID!),
            amount: amount.toString(),
            tokenName: token.name,
          });
        }
      });
    });
  }

  // region Transfer fields
  /** @inheritdoc */
  send(recipient: Recipient): this {
    if (!recipient.tokenName) {
      throw new InvalidParameterValueError('Invalid missing token name');
    }
    const tokenId = getHederaTokenIdFromName(recipient.tokenName);
    if (!tokenId) {
      throw new InvalidParameterValueError(`Invalid token name: ${recipient.tokenName}`);
    }
    if (this._tokenName && this._tokenName !== recipient.tokenName) {
      throw new InvalidParameterValueError(`Invalid token: received ${recipient.tokenName} for ${this._tokenName} tx`);
    }
    this._tokenName = recipient.tokenName;
    return super.send(recipient);
  }
  // endregion
}
