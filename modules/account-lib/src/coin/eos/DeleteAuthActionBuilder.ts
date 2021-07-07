import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { DeleteAuthActionSchema } from './txnSchema';
import Utils from './utils';

export class DeleteAuthActionBuilder extends EosActionBuilder {
  private _account: string;
  private _permission_name: string;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  /**
   * Sets the account to delete permssions from
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
   * Sets the name of the permission to delete
   *
   * @returns {this} this action builder.
   *
   * @param {string} permission_name valid eos name
   */
  permission_name(permission_name: string): this {
    if (Utils.isValidName(permission_name)) {
      this._permission_name = permission_name;
    }
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'deleteauth';
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
      this.validateMandatoryFields(this._account, this._permission_name);
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .deleteauth(this._account, this._permission_name);
    }
  }

  /**
   * Validates whether the required fields are present
   *
   * @param {string} account name of account
   * @param {string} permission_name name of permission
   */
  private validateMandatoryFields(account: string, permission_name: string) {
    const validationResult = DeleteAuthActionSchema.validate({
      account,
      permission_name,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
