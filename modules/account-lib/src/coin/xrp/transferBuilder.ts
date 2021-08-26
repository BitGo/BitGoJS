import { BaseCoin as CoinConfig } from '@bitgo/statics';
import RippleBinaryCodec from 'ripple-binary-codec';
import * as rippleTypes from 'ripple-lib/dist/npm/transaction/types';
import BigNumber from 'bignumber.js';
import { TransactionJSON } from 'ripple-lib';
import { BaseAddress, BaseKey, PaymentId } from '../baseCoin/iface';
import { TransactionType } from '../baseCoin';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransferBuilderSchema } from './txnSchema';

export class TransferBuilder extends TransactionBuilder {
  protected _destination: string;
  protected _amount: string;
  protected _destinationTag: PaymentId;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Sets destination address
   *
   * @param {BaseAddress} destination receiver address
   * @returns {TransferBuilder} builder
   */
  destination(destination: BaseAddress): this {
    this.validateAddress(destination);
    this._destination = destination.address;
    return this;
  }

  /**
   * Set transfer amount
   *
   * @param {number} amount transfer amount
   * @returns {TransferBuilder} builder
   */
  amount(amount: string | number): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount.toString();
    return this;
  }

  /**
   * Set destination tag
   *
   * @param {number} destinationTag
   * @returns {TransferBuilder} builder
   */
  destinationTag(destinationTag: PaymentId): this {
    this.validateValue(new BigNumber(destinationTag.value));
    this._destinationTag = destinationTag;
    return this;
  }

  /** @inheritdoc */
  protected buildXRPTxn(): TransactionJSON {
    const tx: TransactionJSON = {
      Account: this._sender,
      TransactionType: 'Payment',
    };

    tx.Destination = this._destination;
    tx.Amount = this._amount;
    if (this._destinationTag) {
      tx.DestinationTag = this._destinationTag.value;
    }
    return tx;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const xrpTx = tx.getXRPTransaction();
    if (xrpTx) {
      this.destination({ address: xrpTx.Destination as string });
      this.amount(xrpTx.Amount as string);
      if (xrpTx.DestinationTag) {
        this.destinationTag({
          name: 'Destination Tag',
          keyword: 'dt',
          value: xrpTx.DestinationTag as string,
        });
      }
    }
    return tx;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    super.validateTransaction(transaction);
    this.validateFields(this._destination, this._amount, this._destinationTag?.value);
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    super.validateRawTransaction(rawTransaction);
    const decodedXrpTrx = RippleBinaryCodec.decode(rawTransaction) as rippleTypes.TransactionJSON;

    if (decodedXrpTrx.TransactionType !== 'Payment') {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${decodedXrpTrx.TransactionType}. Expected Payment`);
    }

    this.validateFields(
      decodedXrpTrx.Destination as string,
      decodedXrpTrx.Amount as string,
      decodedXrpTrx.DestinationTag as number,
    );
  }

  private validateFields(destination: string, amount: string, destinationTag: number | string): void {
    const validationResult = TransferBuilderSchema.validate({
      destination,
      destinationTag,
      amount,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
