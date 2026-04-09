import { BaseAddress, BaseKey, BaseTransaction, BaseTransactionBuilder } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';

export class TransactionBuilder extends BaseTransactionBuilder {
  protected fromImplementation(rawTransaction: any): BaseTransaction {
    throw new Error('Method not implemented.');
  }
  protected signImplementation(key: BaseKey): BaseTransaction {
    throw new Error('Method not implemented.');
  }
  protected buildImplementation(): Promise<BaseTransaction> {
    throw new Error('Method not implemented.');
  }
  validateKey(key: BaseKey): void {
    throw new Error('Method not implemented.');
  }
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new Error('Method not implemented.');
  }
  validateValue(value: BigNumber): void {
    throw new Error('Method not implemented.');
  }
  validateRawTransaction(rawTransaction: any): void {
    throw new Error('Method not implemented.');
  }
  validateTransaction(transaction?: BaseTransaction): void {
    throw new Error('Method not implemented.');
  }
  protected get transaction(): BaseTransaction {
    throw new Error('Method not implemented.');
  }
  protected set transaction(transaction: BaseTransaction) {
    throw new Error('Method not implemented.');
  }
}
