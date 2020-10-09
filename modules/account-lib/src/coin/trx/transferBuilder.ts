import { createHash } from 'crypto';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import Long from 'long';
import BigNumber from 'bignumber.js';
import { BaseKey } from '../baseCoin/iface';
import { BuildTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { protocol } from '../../../resources/trx/protobuf/tron';
import { Address } from './address';
import { TransferContract, TransactionReceipt } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { getHexAddressFromBase58Address } from './utils';

export class TransferBuilder extends TransactionBuilder {
  private _toAddress: string;
  private _amount: string;
  private _ownerAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction.setTransactionType(TransactionType.Send);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setTransactionReceipt(this.buildTransactionReceipt());
    return super.buildImplementation();
  }

  private buildTransactionReceipt(): TransactionReceipt {
    const amount = Long.fromString(this._amount);
    const owner_address = this._ownerAddress;
    const to_address = this._toAddress;

    const timestamp = Date.now();
    const expiration = timestamp + 60000;

    const raw_data: any = {
      contract: [
        {
          parameter: {
            value: {
              amount: Number(amount),
              owner_address,
              to_address,
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      expiration,
      timestamp,
    };

    const rawDataHex = Buffer.from(protocol.Transaction.raw.encode(raw_data).finish()).toString('hex');

    const txID = createHash('sha256')
      .update(rawDataHex)
      .digest('hex');

    return {
      txID,
      raw_data,
      raw_data_hex: rawDataHex,
      signature: this.transaction.signature,
    };
  }

  // private buildTransferData(): TransferContract {
  //   const amount = Long.fromString(this._amount);
  //   const owner_address = this._ownerAddress;
  //   const to_address = this._toAddress;
  //   return {
  //     parameter: {
  //       value: {
  //         amount: Number(amount),
  //         owner_address,
  //         to_address,
  //       },
  //     },
  //   };
  // }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.Send);
    const raw_data = tx.toJson().raw_data;
    const transferContract = raw_data.contract[0] as TransferContract;
    this.initTransfers(transferContract);
  }

  /**
   * Initialize the transfer specific data, getting the recipient account
   * represented by the element with a positive amount on the transfer element.
   * The negative amount represents the source account so it's ignored.
   *
   * @param {ValueFields} transfer object with transfer data
   */
  protected initTransfers(transfer: TransferContract): void {
    const { amount, owner_address, to_address } = transfer.parameter.value;
    if (amount) {
      this.amount(amount.toFixed());
    }
    if (to_address) {
      this.to({ address: to_address });
    }
    if (owner_address) {
      this.source({ address: owner_address });
    }
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.validateKey(key);
    return super.signImplementation(key);
  }

  //region Transfer fields
  /**
   * Set the source address,
   *
   * @param {Address} address source account
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  source(address: Address): this {
    this.validateAddress(address);
    this._ownerAddress = getHexAddressFromBase58Address(address.address);
    return this;
  }

  /**
   * Set the destination address where the funds will be sent,
   *
   * @param {Address} address the address to transfer funds to
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  to(address: Address): this {
    this.validateAddress(address);
    this._toAddress = getHexAddressFromBase58Address(address.address);
    return this;
  }

  /**
   * Set the amount to be transferred
   *
   * @param {string} amount amount to transfer in sun, 1 TRX = 1000000 sun
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  amount(amount: string): this {
    const BNamount = new BigNumber(amount);
    this.validateValue(BNamount);
    this._amount = BNamount.toFixed();
    return this;
  }

  // rawDataToHex()

  //endregion

  //region Validators

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateMandatoryFields();
  }

  validateMandatoryFields(): void {
    if (this._toAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing to');
    }
    if (this._amount === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing amount');
    }
    if (this._ownerAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing source');
    }
    // super.validateMandatoryFields();
  }
  //endregion
}
