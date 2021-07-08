import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { UnstakeActionSchema } from './txnSchema';

export class UnstakeActionBuilder extends EosActionBuilder {
  private _from: string;
  private _receiver: string;
  private _unstake_net_quantity: string;
  private _unstake_cpu_quantity: string;

  constructor(act: Action) {
    super(act);
    this.action = act;
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
   * Sets the NET unstaking quantity
   *
   * @returns {this} this action builder.
   *
   * @param {string} unstake_net_quantity valid eos quantity
   */
  unstake_net_quantity(unstake_net_quantity: string): this {
    this._unstake_net_quantity = unstake_net_quantity;
    return this;
  }

  /**
   * Sets the CPU unstaking quantity
   *
   * @returns {this} this action builder.
   *
   * @param {string} unstake_cpu_quantity valid eos quantity
   */
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
      this.validateMandatoryFields(this._from, this._receiver, this._unstake_net_quantity, this._unstake_cpu_quantity);
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .undelegatebw(this._from, this._receiver, this._unstake_net_quantity, this._unstake_cpu_quantity);
    }
  }

  /**
   * Validates whether the required fields are present
   *
   * @param {string} from name of sender
   * @param {string} receiver name of receiver
   * @param {string} unstake_net_quantity NET quantity
   * @param {string} unstake_cpu_quantity CPU quantity
   */
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
