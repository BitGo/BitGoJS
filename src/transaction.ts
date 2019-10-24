import { BaseAddress, Destination } from "./coin/baseCoin/iface";
import { BaseCoin as CoinConfig } from "@bitgo/statics";
import { TransactionType } from "./coin/baseCoin/enum";

/**
 * Specifies the members expected for a Transaction
 */
export abstract class BaseTransaction {
  protected _id: string;
  protected _fromAddresses: BaseAddress[];
  protected _destination: Destination[];
  protected _type: TransactionType;

  protected constructor(private _coinConfig: Readonly<CoinConfig>) { }

  get id() {
    return this._id;
  }

  get type() {
    return this._type;
  }

  get destinations(): Destination[] {
    return this._destination;
  }

  get senders(): BaseAddress[] {
    return this._fromAddresses;
  }

  abstract toJson(): any;
}
