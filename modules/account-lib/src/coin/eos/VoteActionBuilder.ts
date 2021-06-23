import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { VoteActionSchema } from './txnSchema';

export class VoteActionBuilder extends EosActionBuilder {
  private _voter: string;
  private _proxy: string;
  private _producers: string[];

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  /**
   * Sets the account name of the voter
   *
   * @returns {this} this action builder.
   *
   * @param {string} voter valid eos name
   */
  voter(voter: string): this {
    this._voter = voter;
    return this;
  }

  /**
   * Sets the account name of the proxy
   *
   * @returns {this} this action builder.
   *
   * @param {string} proxy valid eos name
   */
  proxy(proxy: string): this {
    this._proxy = proxy;
    return this;
  }

  /**
   * Sets the list of names of producers
   *
   * @returns {this} this action builder.
   *
   * @param {string[]} producers valid list of eos name
   */
  producers(producers: string[]): this {
    this._producers = producers;
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'voteproducer';
  }

  /** @inheritdoc */
  build(builder: EosTxBuilder): EosJs.Serialize.Action {
    const data = this.action.data;
    if (typeof data === 'string') {
      return {
        account: this.action.account,
        name: this.actionName(),
        authorization: this.action.authorization,
        data: data,
      };
    } else {
      this.validateMandatoryFields(
        this._voter,
        this._proxy,
        this._producers,
      );
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .voteproducer(this._voter, this._proxy, this._producers);
    }
  }

  /**
   * Validates whether the required fields are present
   *
   * @param {string} voter name of voter
   * @param {string} proxy name of proxy
   * @param {string[]} producers producers
   */
  private validateMandatoryFields(
    voter: string,
    proxy: string,
    producers: string[]
  ) {
    const validationResult = VoteActionSchema.validate({
      voter,
      proxy,
      producers,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}


