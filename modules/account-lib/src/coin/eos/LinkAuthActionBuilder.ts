import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { LinkAuthActionSchema } from './txnSchema';
import Utils from './utils';

export class LinkAuthActionBuilder extends EosActionBuilder {
  private _account: string;
  private _code: string;
  private _type: string;
  private _requirement: string;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  account(account: string): this {
    if (Utils.isValidName(account)) {
      this._account = account;
    }
    return this;
  }

  code(code: string): this {
    if (Utils.isValidName(code)) {
      this._code = code;
    }
    return this;
  }

  type(type: string): this {
    if (Utils.isValidName(type)) {
      this._type = type;
    }
    return this;
  }

  requirement(requirement: string): this {
    if (Utils.isValidName(requirement)) {
      this._requirement = requirement;
    }
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'linkauth';
  }

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
      this.validateMandatoryFields(this._account, this._code, this._type, this._requirement);
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .linkauth(this._account, this._code, this._type, this._requirement);
    }
  }

  private validateMandatoryFields(account: string, code: string, type: string, requirement: string) {
    const validationResult = LinkAuthActionSchema.validate({
      account,
      code,
      type,
      requirement,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
