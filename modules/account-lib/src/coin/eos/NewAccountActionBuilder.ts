import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action, PublicKey } from './ifaces';
import { NewAccoutActionSchema } from './txnSchema';

export class NewAccountActionBuilder extends EosActionBuilder {
  private _creator: string;
  private _name: string;
  private _owner: PublicKey;
  private _active: PublicKey;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  /**
   * Sets the account name of the creator
   *
   * @returns {this} this action builder.
   *
   * @param {string} creator valid eos name
   */
  creator(creator: string): this {
    this._creator = creator;
    return this;
  }

  /**
   * Sets the account name
   *
   * @returns {this} this action builder.
   *
   * @param {string} receiver valid eos name
   */
  name(name: string): this {
    this._name = name;
    return this;
  }

  /**
   * Sets the owner public key
   *
   * @returns {this} this action builder.
   *
   * @param {PublicKey} owner valid eos public key
   */
  owner(owner: PublicKey): this {
    this._owner = owner;
    return this;
  }

  /**
   * Sets the owner public key
   *
   * @returns {this} this action builder.
   *
   * @param {PublicKey} active valid eos public key
   */
  active(active: PublicKey): this {
  this._active = active;
  return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'newaccount';
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
        this._creator,
        this._name,
        this._owner,
        this._active,
      );
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .newaccount(this._creator, this._name, this._owner, this._active);
    }
  }

  /**
   * Validates whether the required fields are present
   *
   * @param {string} creator name of creator
   * @param {string} name name of account
   * @param {PublicKey} owner owner public key
   * @param {PublicKey} active active public key
   */
  private validateMandatoryFields(
    creator: string,
    name: string,
    owner: PublicKey,
    active: PublicKey
  ) {
    const validationResult = NewAccoutActionSchema.validate({
      creator,
      name,
      owner,
      active
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
