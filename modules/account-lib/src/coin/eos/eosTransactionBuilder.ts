import { BaseCoin as CoinConfig } from '@bitgo/statics';
// import { TransactionType } from '../baseCoin';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StakeActionBuilder } from './StakeActionBuilder';
import { UnstakeActionBuilder } from './UnstakeActionBuilder';
import { UpdateAuthActionBuilder } from './UpdateAuthActionBuilder';
import { DeleteAuthActionBuilder } from './DeleteAuthActionBuilder';
import { LinkAuthActionBuilder } from './LinkAuthActionBuilder';
import { UnlinkAuthActionBuilder } from './UnlinkAuthActionBuilder';
import { TransferActionBuilder } from './TransferActionBuilder';
import { BuyRamBytesActionBuilder } from './BuyRamBytesActionBuilder';
import { VoteActionBuilder } from './VoteActionBuilder';
import { PowerUpActionBuilder } from './powerupActionBuilder';
import { NewAccountActionBuilder } from './NewAccountActionBuilder';

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
   * @returns {BuyRamBytesActionBuilder} builder to construct buy ram bytes action
   */
  buyRamBytesActionBuilder(account: string, actors: string[]): BuyRamBytesActionBuilder {
    const builder = new BuyRamBytesActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
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
   * Initialize power up building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {TransferActionBuilder} builder to construct transfer action
   */
  powerupActionBuilder(account: string, actors: string[]): PowerUpActionBuilder {
    const builder = new PowerUpActionBuilder(super.action(account, actors));
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

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {UpdateAuthActionBuilder} builder to construct update auth action
   */
  updateAuthActionBuilder(account: string, actors: string[]): UpdateAuthActionBuilder {
    const builder = new UpdateAuthActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {DeleteAuthActionBuilder} builder to construct delete auth action
   */
  deleteAuthActionBuilder(account: string, actors: string[]): DeleteAuthActionBuilder {
    const builder = new DeleteAuthActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {LinkAuthActionBuilder} builder to construct link auth action
   */
  linkAuthActionBuilder(account: string, actors: string[]): LinkAuthActionBuilder {
    const builder = new LinkAuthActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {UnlinkAuthActionBuilder} builder to construct unlink auth action
   */
  unlinkAuthActionBuilder(account: string, actors: string[]): UnlinkAuthActionBuilder {
    const builder = new UnlinkAuthActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {VoteActionBuilder} builder to construct vote action
   */
  voteActionBuilder(account: string, actors: string[]): VoteActionBuilder {
    const builder = new VoteActionBuilder(super.action(account, actors));
    this.actionBuilders.push(builder);
    return builder;
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {NewAccountActionBuilder} builder to construct new account
   */
  newAccountActionBuilder(account: string, actors: string[]): NewAccountActionBuilder {
    const builder = new NewAccountActionBuilder(super.action(account, actors));
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
