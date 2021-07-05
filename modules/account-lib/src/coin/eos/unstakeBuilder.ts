import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { Action } from './ifaces';
import { UnstakeActionBuilder } from './eosActionBuilder';

export class UnstakeBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._transaction.setTransactionType(TransactionType.StakingWithdraw);
    return super.buildImplementation();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {StakeActionBuilder} builder to construct unstake action
   */
  actionBuilder(account: string, actors: string[]): UnstakeActionBuilder {
    return new UnstakeActionBuilder(super.action(account, actors));
  }

  /** @inheritdoc */
  protected createAction(builder: EosTxBuilder, action: Action): EosJs.Serialize.Action {
    const data = action.data;
    if (typeof data === 'string') {
      return {
        account: action.account,
        name: action.name,
        authorization: action.authorization,
        data: data,
      };
    } else {
      return builder
        .with(action.account)
        .as(action.authorization)
        .undelegatebw(data.from, data.receiver, data.unstake_net_quantity, data.unstake_cpu_quantity);
    }
  }

  protected actionName(): string {
    return 'undelegatebw';
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
