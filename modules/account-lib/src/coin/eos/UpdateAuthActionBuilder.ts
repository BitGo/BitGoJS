import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action, PermissionAuth } from './ifaces';
import { UpdateAuthActionSchema, PermissionAuthSchema } from './txnSchema';
import Utils from './utils';
import { PermissionAuthValidationError } from './errors';

export class UpdateAuthActionBuilder extends EosActionBuilder {
  private _account: string;
  private _permission_name: string;
  private _parent: string;
  private _auth: PermissionAuth;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  /**
   * Sets the new permission's owner
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
   * Sets the new permission's name
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
   * Sets the permission's active status
   *
   * @returns {this} this action builder.
   *
   * @param {string} parent valid eos name
   */
  parent(parent: string): this {
    if (Utils.isValidName(parent)) {
      this._parent = parent;
    }
    return this;
  }

  /**
   * Sets the authorization' for the new permssion
   *
   * @returns {this} this action builder.
   *
   * @param {PermissionAuth} auth valid eos name
   */
  auth(auth: PermissionAuth): this {
    const validationResult = PermissionAuthSchema.validate(auth);
    if (validationResult.error) {
      throw new PermissionAuthValidationError(`Permission auth validation failed: ${validationResult.error.message}`);
    }
    this._auth = auth;
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'updateauth';
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
      this.validateMandatoryFields(this._account, this._permission_name, this._parent, this._auth);
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .updateauth(this._account, this._permission_name, this._parent, this._auth);
    }
  }

  /**
   * Validates whether the required fields are present
   *
   * @param {string} account name of account
   * @param {string} permission_name name of the new permission
   * @param {string} parent the permissions active status
   * @param {PermissionAuth} auth the authorization for the permission
   */
  private validateMandatoryFields(account: string, permission_name: string, parent: string, auth: PermissionAuth) {
    const validationResult = UpdateAuthActionSchema.validate({
      account,
      permission_name,
      parent,
      auth,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
