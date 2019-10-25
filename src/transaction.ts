import {BaseAddress, BaseKey, Destination} from "./coin/baseCoin/iface";
import { BaseCoin as CoinConfig } from "@bitgo/statics";
import { TransactionType } from "./coin/baseCoin";

/**
 * Specifies the members expected for a Transaction
 */
export abstract class BaseTransaction {
  protected _id: string;  // The transaction id as seen in the blockchain
  protected _fromAddresses: BaseAddress[];
  protected _destination: Destination[];
  protected _type: TransactionType;
  protected _validFrom: number;
  protected _validTo: number;

  protected constructor(protected _coinConfig: Readonly<CoinConfig>) { }

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

  get validFrom(): number {
    return this._validFrom;
  }

  get validTo(): number {
    return this._validTo;
  }

  /**
   * Whether the private key can sign this transaction in its current state or not. it is possible
   * some transactions can only enforce this check after some other fields have been filled already
   * or even during build time.
   * @param key to verify permissions on
   * @return false if the key cannot sign the transaction without a doubt, true otherwise
   */
  abstract canSign(key: BaseKey): boolean;

  abstract toJson(): any;
}
