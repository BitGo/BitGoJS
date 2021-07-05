import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import * as EosJs from 'eosjs';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TransferActionSchema } from './txnSchema';
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
