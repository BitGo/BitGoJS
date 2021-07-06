import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import * as EosJs from 'eosjs';
import { InvalidTransactionError } from '../baseCoin/errors';
import { Action, PermissionAuth } from './ifaces';
import {
  DeleteAuthActionSchema,
  LinkAuthActionSchema,
  PermissionAuthSchema,
  StakeActionSchema,
  TransferActionSchema,
  UnlinkAuthActionSchema,
  UnstakeActionSchema,
  UpdateAuthActionSchema,
} from './txnSchema';
import Utils from './utils';
import { PermissionAuthValidationError } from './errors';

export abstract class EosActionBuilder {
  protected action: Action;
  constructor(act: Action) {
    this.action = act;
  }

  /**
   * Build eos transaction action
   *
   * @param {EosTxBuilder} builder Eos transaction builder
   */
  abstract build(builder: EosTxBuilder): EosJs.Serialize.Action;
}

export class TransferActionBuilder extends EosActionBuilder {
  private _from: string;
  private _to: string;
  private _quantity: string;
  private _memo: string;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  from(from: string): this {
    this._from = from;
    return this;
  }

  to(to: string): this {
    this._to = to;
    return this;
  }

  quantity(qty: string): this {
    this._quantity = qty;
    return this;
  }

  memo(memo: string): this {
    this._memo = memo;
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'transfer';
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
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .transfer(this._from, this._to, this._quantity, this._memo);
    }
  }

  private validateMandatoryFields(from: string, to: string, quantity: string, memo: string) {
    const validationResult = TransferActionSchema.validate({
      from,
      to,
      quantity,
      memo,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}

export class StakeActionBuilder extends EosActionBuilder {
  private _from: string;
  private _receiver: string;
  private _stake_net_quantity: string;
  private _stake_cpu_quantity: string;
  private _transfer: boolean;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  from(from: string): this {
    this._from = from;
    return this;
  }

  receiver(receiver: string): this {
    this._receiver = receiver;
    return this;
  }

  stake_net_quantity(stake_net_quantity: string): this {
    this._stake_net_quantity = stake_net_quantity;
    return this;
  }

  stake_cpu_quantity(stake_cpu_quantity: string): this {
    this._stake_cpu_quantity = stake_cpu_quantity;
    return this;
  }

  transfer(transfer: boolean): this {
    this._transfer = transfer;
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'delegatebw';
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
      this.validateMandatoryFields(
        this._from,
        this._receiver,
        this._stake_net_quantity,
        this._stake_cpu_quantity,
        this._transfer,
      );
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .delegatebw(this._from, this._receiver, this._stake_net_quantity, this._stake_cpu_quantity, this._transfer);
    }
  }

  private validateMandatoryFields(
    from: string,
    receiver: string,
    stake_net_quantity: string,
    stake_cpu_quantity: string,
    transfer: boolean,
  ) {
    const validationResult = StakeActionSchema.validate({
      from,
      receiver,
      stake_net_quantity,
      stake_cpu_quantity,
      transfer,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}

export class UnstakeActionBuilder extends EosActionBuilder {
  private _from: string;
  private _receiver: string;
  private _unstake_net_quantity: string;
  private _unstake_cpu_quantity: string;

  constructor(act: Action) {
    super(act);
    this.action = act;
  }

  from(from: string): this {
    this._from = from;
    return this;
  }

  receiver(receiver: string): this {
    this._receiver = receiver;
    return this;
  }

  unstake_net_quantity(unstake_net_quantity: string): this {
    this._unstake_net_quantity = unstake_net_quantity;
    return this;
  }

  unstake_cpu_quantity(unstake_cpu_quantity: string): this {
    this._unstake_cpu_quantity = unstake_cpu_quantity;
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'undelegatebw';
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
      this.validateMandatoryFields(this._from, this._receiver, this._unstake_net_quantity, this._unstake_cpu_quantity);
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .undelegatebw(this._from, this._receiver, this._unstake_net_quantity, this._unstake_cpu_quantity);
    }
  }

  private validateMandatoryFields(
    from: string,
    receiver: string,
    unstake_net_quantity: string,
    unstake_cpu_quantity: string,
  ) {
    const validationResult = UnstakeActionSchema.validate({
      from,
      receiver,
      unstake_net_quantity,
      unstake_cpu_quantity,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}

export class UpdateAuthActionBuilder extends EosActionBuilder {
  private _account: string;
  private _permission_name: string;
  private _parent: string;
  private _auth: PermissionAuth;

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

  permission_name(permission_name: string): this {
    if (Utils.isValidName(permission_name)) {
      this._permission_name = permission_name;
    }
    return this;
  }

  parent(parent: string): this {
    if (Utils.isValidName(parent)) {
      this._parent = parent;
    }
    return this;
  }

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

export class DeleteAuthActionBuilder extends EosActionBuilder {
  private _account: string;
  private _permission_name: string;

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

export class UnlinkAuthActionBuilder extends EosActionBuilder {
  private _account: string;
  private _code: string;
  private _type: string;

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

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'unlinkauth';
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
      this.validateMandatoryFields(this._account, this._code, this._type);
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .unlinkauth(this._account, this._code, this._type);
    }
  }

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
