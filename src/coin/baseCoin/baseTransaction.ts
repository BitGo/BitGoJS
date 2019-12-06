import { BaseAddress, BaseKey, Destination } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from './enum';

/**
 * Generic transaction. Should be extended with coin specific members.
 */
export abstract class BaseTransaction {
  protected _id: string; // The transaction id as seen in the blockchain
  protected _fromAddresses: BaseAddress[];
  protected _destination: Destination[];
  protected _type: TransactionType;

  /**
   * Base constructor.
   * @param _coinConfig BaseCoin from statics library
   */
  protected constructor(protected _coinConfig: Readonly<CoinConfig>) {}

  get id(): string {
    return this._id;
  }

  get type(): TransactionType {
    return this._type;
  }

  get destinations(): Destination[] {
    return this._destination;
  }

  get senders(): BaseAddress[] {
    return this._fromAddresses;
  }

  /**
   * Whether the private key can sign this transaction in its current state or not. it is possible
   * some transactions can only enforce this check after some other fields have been filled already
   * or even during build time.
   * @param key to verify permissions on
   * @return false if the key cannot sign the transaction without a doubt, true otherwise
   */
  abstract canSign(key: BaseKey): boolean;

  /**
   * Returns the transaction in a valid JSON format.
   */
  abstract toJson(): any;
}
