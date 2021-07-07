import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { UnlinkAuthActionSchema } from './txnSchema';
import Utils from './utils';

export class UnlinkAuthActionBuilder extends EosActionBuilder {
  private _account: string;
  private _code: string;
  private _type: string;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  /**
   * Sets the permission's owner to be linked and the payer of the RAM needed to store
   *
   * @returns {this} this action builder.
   *
   * @param {string} account valid eos name
   */
  account(account: string): this {
    if (Utils.isValidName(account)) {
      this._account = account;
    }
    return this;
  }

  /**
   * Sets the owner of the action to be linked
   *
   * @returns {this} this action builder.
   *
   * @param {string} code valid eos name
   */
  code(code: string): this {
    if (Utils.isValidName(code)) {
      this._code = code;
    }
    return this;
  }

  /**
   * Sets the the action to be linked
   *
   * @returns {this} this action builder.
   *
   * @param {string} type valid eos name
   */
  type(type: string): this {
    if (Utils.isValidName(type)) {
      this._type = type;
    }
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'unlinkauth';
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
      this.validateMandatoryFields(this._account, this._code, this._type);
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .unlinkauth(this._account, this._code, this._type);
    }
  }

  /**
   * Validates whether the required fields are present
   *
   * @param {string} account name of account
   * @param {string} code owner of the action to be linked
   * @param {string} type the action to be linked
   */
  private validateMandatoryFields(account: string, code: string, type: string) {
    const validationResult = UnlinkAuthActionSchema.validate({
      account,
      code,
      type,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
