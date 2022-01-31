import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLValue, CLPublicKey as PublicKey, CLValueBuilder } from 'casper-js-sdk';
import { BuildTransactionError, InvalidParameterValueError, SigningError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import { TRANSACTION_TYPE, TRANSFER_TO_ADDRESS } from './constants';
import {
  isValidTransferAmount,
  isValidTransferId,
  getTransferDestinationAddress,
  getTransferAmount,
  getTransferId,
  isValidAddress,
} from './utils';

export class TransferBuilder extends TransactionBuilder {
  private _toAddress: string;
  private _amount: string;
  private _transferId: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const extraArguments = new Map<string, CLValue>();
    if (this._toAddress) {
      extraArguments.set(TRANSACTION_TYPE, CLValueBuilder.string(TransactionType[TransactionType.Send]));
      extraArguments.set(TRANSFER_TO_ADDRESS, CLValueBuilder.string(this._toAddress));
    }
    this._session = {
      amount: this._amount,
      target: PublicKey.fromHex(this._toAddress),
      id: this._transferId,
      extraArguments: extraArguments,
    };
    this.transaction.setTransactionType(TransactionType.Send);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.Send);
    this.to(getTransferDestinationAddress(tx.casperTx.session));
    this.amount(getTransferAmount(tx.casperTx.session));
    const transferId = getTransferId(tx.casperTx.session);
    if (transferId !== undefined) {
      this.transferId(transferId);
    }
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
   * @param {string} amount amount to transfer in motes (1 Cspr equals 1,000,000,000 motes)
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  amount(amount: string): this {
    if (!isValidTransferAmount(amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._amount = amount;
    return this;
  }

  /**
   * Set transfer id that acts as a transaction identifier (similar to memo id for Stellar)
   *
   * @param {number} id transfer id
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  transferId(id: number): this {
    if (!isValidTransferId(id)) {
      throw new InvalidParameterValueError('Invalid transfer id');
    }
    this._transferId = id;
    return this;
  }

  // endregion

  // region Validators
  validateMandatoryFields(): void {
    if (!this._toAddress) {
      throw new BuildTransactionError('Invalid transaction: missing to');
    }
    if (!isValidAddress(this._toAddress)) {
      throw new InvalidParameterValueError('Invalid to address');
    }
    if (!this._amount) {
      throw new BuildTransactionError('Invalid transaction: missing amount');
    }
    if (!isValidTransferAmount(this._amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    super.validateMandatoryFields();
  }
  // endregion
}
