import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { BaseTransactionBuilder } from '../baseCoin';
import { BuildTransactionError } from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { isValidAccount } from './utils';

export class TransactionBuilder extends BaseTransactionBuilder {
  protected _fee: BaseFee;
  protected _transaction: Transaction;
  protected _source: BaseAddress;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  fee(fee: BaseFee): this {
    this.validateValue(new BigNumber(fee.fee));
    this._fee = fee;
    return this;
  }

  source(address: BaseAddress): this {
    this.validateAddress(address);
    this._source = address;
    return this;
  }

  protected async buildImplementation(): Promise<Transaction> {
    throw new Error('unimplemented');
  }

  protected fromImplementation(rawTransaction: any): Transaction {
    throw new Error('unimplemented');
  }

  protected signImplementation(key: BaseKey): Transaction {
    throw new Error('unimplemented');
  }

  protected get transaction(): Transaction {
    return this._transaction;
  }

  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!isValidAccount(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  validateKey(key: BaseKey): void {
    console.log('To be implemented');
  }

  validateRawTransaction(rawTransaction: any): void {
    console.log('To be implemented');
  }

  validateTransaction(transaction: Transaction): void {
    console.log('To be implemented');
  }

  validateValue(value: BigNumber): void {
    console.log('To be implemented');
  }
}
