import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { PowerupActionSchema } from './txnSchema';

// https://github.com/EOSIO/eosio.contracts/releases
export class PowerUpActionBuilder extends EosActionBuilder {
  private _payer: string;
  private _receiver: string;
  private _days: number;
  private _net_frac: string;
  private _cpu_frac: string;
  private _max_payment: string;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  /**
   * The resource buyer
   *
   * @param {string} payer payer account name
   * @returns {this} this action builder.
   */
  payer(payer: string): this {
    this._payer = payer;
    return this;
  }

  /**
   * The resource receiver
   *
   * @param {string} receiver receiver account name
   * @returns {this} this action builder.
   */
  receiver(receiver: string): this {
    this._receiver = receiver;
    return this;
  }

  /**
   * Number of days of resource availability
   *
   * @param {string} days number of days.
   * @returns {this} this action builder.
   */
  days(days: number): this {
    this._days = days;
    return this;
  }

  /**
   * Fraction of net (100% = 10^15) managed by this market
   *
   * @param {string} net_frac net fraction.
   * @returns {this} this action builder.
   */
  netFrac(net_frac: string): this {
    this._net_frac = net_frac;
    return this;
  }

  /**
   * Fraction of cpu (100% = 10^15) managed by this market
   *
   * @param {string} cpu_frac cpu fraction.
   * @returns {this} this action builder.
   */
  cpuFrac(cpu_frac: string): this {
    this._cpu_frac = cpu_frac;
    return this;
  }

  /**
   * The maximum amount `payer` is willing to pay. Tokens are withdrawn from `payer`'s token balance.
   *
   * @param {string} max_payment maximum payment.
   * @returns {this} this action builder.
   */
  maxPayment(max_payment: string): this {
    this._max_payment = max_payment;
    return this;
  }

  actionName(): string {
    return 'powerup';
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
        this._payer,
        this._receiver,
        this._days,
        this._net_frac,
        this._cpu_frac,
        this._max_payment,
      );
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .powerup(this._payer, this._receiver, this._days, this._net_frac, this._cpu_frac, this._max_payment);
    }
  }

  private validateMandatoryFields(
    payer: string,
    receiver: string,
    days: number,
    net_frac: string,
    cpu_frac: string,
    max_payment: string,
  ) {
    const validationResult = PowerupActionSchema.validate({
      payer,
      receiver,
      days,
      net_frac,
      cpu_frac,
      max_payment,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
