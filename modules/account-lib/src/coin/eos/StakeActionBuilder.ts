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

  /**
   * Sets the account name of the user staking resources
   *
   * @returns {this} this action builder.
   *
   * @param {string} from valid eos name
   */
  from(from: string): this {
    this._from = from;
    return this;
  }

  /**
   * Sets the account name of the reciever of the staked resources
   *
   * @returns {this} this action builder.
   *
   * @param {string} receiver valid eos name
   */
  receiver(receiver: string): this {
    this._receiver = receiver;
    return this;
  }

  /**
   * Sets the NET staking quantity
   *
   * @returns {this} this action builder.
   *
   * @param {string} stake_net_quantity valid eos quantity
   */
  stake_net_quantity(stake_net_quantity: string): this {
    this._stake_net_quantity = stake_net_quantity;
    return this;
  }

  /**
   * Sets the CPU staking quantity
   *
   * @returns {this} this action builder.
   *
   * @param {string} stake_cpu_quantity valid eos quantity
   */
  stake_cpu_quantity(stake_cpu_quantity: string): this {
    this._stake_cpu_quantity = stake_cpu_quantity;
    return this;
  }

  /**
   * Sets whether the ownership should be transfered
   *
   * @returns {this} this action builder.
   *
   * @param {boolean} transfer defaults to true
   */
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

  /**
   * Validates whether the required fields are present
   *
   * @param {string} from name of sender
   * @param {string} receiver name of receiver
   * @param {string} stake_net_quantity NET quantity
   * @param {string} stake_cpu_quantity CPU quantity
   * @param {string} transfer Ownership transfer
   */
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
