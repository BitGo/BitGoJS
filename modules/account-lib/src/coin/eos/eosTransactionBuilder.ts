import { BaseCoin as CoinConfig } from '@bitgo/statics';
// import { TransactionType } from '../baseCoin';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StakeActionBuilder, TransferActionBuilder, UnstakeActionBuilder } from './eosActionBuilder';

export class EosTransactionBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.actionBuilders = [];
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
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
   * @returns {TransferActionBuilder} builder to construct transfer action
   */
  transferActionBuilder(account: string, actors: string[]): TransferActionBuilder {
    const builder = new TransferActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {StakeActionBuilder} builder to construct stake action
   */
  stakeActionBuilder(account: string, actors: string[]): StakeActionBuilder {
    const builder = new StakeActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {UnstakeActionBuilder} builder to construct unstake action
   */
  unstakeActionBuilder(account: string, actors: string[]): UnstakeActionBuilder {
    const builder = new UnstakeActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
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
