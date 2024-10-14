import { Amount, IssuedCurrencyAmount, Payment } from 'xrpl';
import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { XrpTransactionType } from './iface';
import { Transaction } from './transaction';
import utils from './utils';
import _ from 'lodash';

export class TokenTransferBuilder extends TransactionBuilder {
  private _amount: Amount;
  private _destination: string;
  private _destinationTag?: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  protected get xrpTransactionType(): XrpTransactionType.Payment {
    return XrpTransactionType.Payment;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    const { destination, amount, destinationTag } = tx.toJson();
    if (!destination) {
      throw new BuildTransactionError('Missing destination');
    }
    if (!amount) {
      throw new BuildTransactionError('Missing amount');
    }

    const normalizeAddress = utils.normalizeAddress({ address: destination, destinationTag });
    this.to(normalizeAddress);
    this.amount(amount);
  }

  /**
   *  Set the receiver address
   * @param {string} address - the address with optional destination tag
   * @returns {TransactionBuilder} This transaction builder
   */
  to(address: string): TransactionBuilder {
    const { address: xrpAddress, destinationTag } = utils.getAddressDetails(address);
    this._destination = xrpAddress;
    this._destinationTag = destinationTag;
    return this;
  }

  /**
   *  Set the amount to send
   * @param {string} amount - the amount sent
   * @returns {TransactionBuilder} This transaction builder
   */
  amount(amount: Amount): TransactionBuilder {
    function isIssuedCurrencyAmount(amount: Amount): amount is IssuedCurrencyAmount {
      return (
        !_.isString(amount) &&
        _.isObjectLike(amount) &&
        _.isString(amount.currency) &&
        _.isString(amount.issuer) &&
        _.isString(amount.value)
      );
    }

    if (!isIssuedCurrencyAmount(amount)) {
      throw new Error(`amount type ${typeof amount} must be a IssuedCurrencyAmount type`);
    }
    this._amount = amount;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender) {
      throw new BuildTransactionError('Sender must be set before building the transaction');
    }

    const transferFields: Payment = {
      TransactionType: this.xrpTransactionType,
      Account: this._sender,
      Destination: this._destination,
      Amount: this._amount,
    };

    if (this._destinationTag) {
      transferFields.DestinationTag = this._destinationTag;
    }

    this._specificFields = transferFields;

    return await super.buildImplementation();
  }
}
