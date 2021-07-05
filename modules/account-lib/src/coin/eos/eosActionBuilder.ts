import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { Action } from './ifaces';

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
