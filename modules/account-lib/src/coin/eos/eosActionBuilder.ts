import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import * as EosJs from 'eosjs';
import { InvalidTransactionError } from '../baseCoin/errors';
import { Action, ActionData } from './ifaces';
import { StakeActionSchema, TransferActionSchema, UnstakeActionSchema } from './txnSchema';

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
  private action: Action;
  private actionData: ActionData;

  constructor(act: Action) {
    super();
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

  buildAction(): Action {
    this.validateMandatoryFields(
      this._from,
      this._receiver,
      this._stake_net_quantity,
      this._stake_cpu_quantity,
      this._transfer,
    );
    this.actionData = {
      from: this._from,
      receiver: this._receiver,
      stake_net_quantity: this._stake_net_quantity,
      stake_cpu_quantity: this._stake_cpu_quantity,
      transfer: this._transfer,
    };
    this.action.data = this.actionData;
    return this.action;
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
  private action: Action;
  private actionData: ActionData;

  constructor(act: Action) {
    super();
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

  buildAction(): Action {
    this.validateMandatoryFields(this._from, this._receiver, this._unstake_net_quantity, this._unstake_cpu_quantity);
    this.actionData = {
      from: this._from,
      receiver: this._receiver,
      unstake_net_quantity: this._unstake_net_quantity,
      unstake_cpu_quantity: this._unstake_cpu_quantity,
    };
    this.action.data = this.actionData;
    return this.action;
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
