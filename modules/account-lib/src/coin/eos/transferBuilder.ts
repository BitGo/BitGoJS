import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as EosJs from 'eosjs';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { Action } from './ifaces';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('method not implemented');
  }

  protected actionData(action: Action, data: any): EosJs.Serialize.Action {
    throw new NotImplementedError('Method not implemented.');
  }
}
