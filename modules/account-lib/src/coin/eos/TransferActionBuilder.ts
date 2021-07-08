import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { TransferActionSchema } from './txnSchema';

export class TransferActionBuilder extends EosActionBuilder {
  private _from: string;
  private _to: string;
  private _quantity: string;
  private _memo: string;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  /**
   * Sets the account name of the user sending tokens
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
   * Sets the account name of the user receiving tokens
   *
   * @returns {this} this action builder.
   *
   * @param {string} to valid eos name
   */
  to(to: string): this {
    this._to = to;
    return this;
  }

  /**
   * Sets the quantity of tokens
   *
   * @returns {this} this action builder.
   *
   * @param {string} qty valid eos quantity
   */
  quantity(qty: string): this {
    this._quantity = qty;
    return this;
  }

  /**
   * Sets the memo
   *
   * @returns {this} this action builder.
   *
   * @param {string} memo valid eos memo
   */
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
      this.validateMandatoryFields(this._from, this._to, this._quantity, this._memo);
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .transfer(this._from, this._to, this._quantity, this._memo);
    }
  }

  /**
   * Validates whether the required fields are present
   *
   * @param {string} from name of sender
   * @param {string} to name of receiver
   * @param {string} quantity token quantity
   * @param {string} memo trx memo
   */
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
