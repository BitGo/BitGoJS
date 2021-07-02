import { InvalidTransactionError } from '../baseCoin/errors';
import { Action, ActionData } from './ifaces';
import { TransferActionSchema } from './txnSchema';

export abstract class EosActionBuilder {}

export class TransferActionBuilder extends EosActionBuilder {
  private _from: string;
  private _to: string;
  private _quantity: string;
  private _memo: string;
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

  buildAction(): Action {
    this.validateMandatoryFields(this._from, this._to, this._quantity, this._memo);
    this.actionData = {
      from: this._from,
      to: this._to,
      quantity: this._quantity,
      memo: this._memo,
    };
    this.action.data = this.actionData;
    return this.action;
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
