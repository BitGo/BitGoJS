import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { Action } from './ifaces';
import { EosActionBuilder } from './eosActionBuilder';

export class WalletInitializationBuilder extends TransactionBuilder {
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

  /** @inheritdoc */
  protected createAction(builder: EosTxBuilder, action: Action): EosJs.Serialize.Action {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  actionBuilder(account: string, actors: string[]): EosActionBuilder {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  protected actionName(): string {
    throw new Error('Method not implemented.');
  }
}
