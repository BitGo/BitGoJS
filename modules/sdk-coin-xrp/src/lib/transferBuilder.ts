import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Amount, Payment } from 'xrpl';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class TransferBuilder extends TransactionBuilder {
  private _amount: Amount;
  private _destination: string;
  private _destinationTag?: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  protected get xrpTransactionType(): 'Payment' {
    return 'Payment';
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
    if (typeof amount !== 'string') {
      throw new BuildTransactionError('Invalid Amount');
    }
    this.amount(amount);
  }

  /**
   *  Set the receiver address
   * @param {string} address - the address with optional destination tag
   * @returns {TransactionBuilder} This transaction builder
   */
  to(address: string): TransferBuilder {
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
  amount(amount: string): TransactionBuilder {
    if (typeof amount !== 'string') {
      throw new Error(`amount type ${typeof amount} must be a string`);
    }
    const amountBigInt = BigInt(amount);
    if (amountBigInt < 0) {
      throw new Error(`amount ${amount} is not valid`);
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

    if (typeof this._destinationTag === 'number') {
      transferFields.DestinationTag = this._destinationTag;
    }

    this._specificFields = transferFields;

    return await super.buildImplementation();
  }
}
