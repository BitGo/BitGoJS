import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as EosJs from 'eosjs';
import { NotImplementedError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    return super.buildImplementation();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    throw new NotImplementedError('error: method not implemented');
  }

  protected actionData(
    action: EosJs.ApiInterfaces.ActionSerializerType,
    data: any,
  ): EosJs.ApiInterfaces.ActionSerializerType {
    return action.transfer(data.from, data.to, data.quantity, data.memo);
  }

  protected actionName(): string {
    return 'transfer';
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    super.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);
  }
}
