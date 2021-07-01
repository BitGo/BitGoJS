import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { NotImplementedError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { Action } from './ifaces';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    return super.buildImplementation();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    throw new NotImplementedError('error: method not implemented');
  }

  /**
   * Initialize building action
   *
   * @param {string} account Account name
   * @param {string[]} actors Authorization field
   * @returns {TransferActionBuilder} builder to construct transfer action
   */
  actionBuilder(account: string, actors: string[]): TransferActionBuilder {
    return new TransferActionBuilder(super.action(account, actors));
  }

  protected createAction(builder: EosTxBuilder, action: Action): EosJs.Serialize.Action {
    const { data } = action;
    return builder.with(action.account).as(action.authorization).transfer(data.from, data.to, data.quantity, data.memo);
  }

  protected actionName(): string {
    return 'transfer';
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    super.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);
  }
}

class TransferActionBuilder {
  private _from: string;
  private _to: string;
  private _quantity: string;
  private _memo: string;
  private action: Action;

  constructor(act: Action) {
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

  quantitiy(qty: string): this {
    this._quantity = qty;
    return this;
  }

  memo(memo: string): this {
    this._memo = memo;
    return this;
  }

  buildAction(): Action {
    this.validateMandatoryFields();
    this.action.data.from = this._from;
    this.action.data.to = this._to;
    this.action.data.quantity = this._quantity;
    this.action.data.memo = this._memo;
    return this.action;
  }

  private validateMandatoryFields() {
    // TODO: perform validataion on from, to and quantity
  }
}
