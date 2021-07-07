import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { StakeActionSchema } from './txnSchema';

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
