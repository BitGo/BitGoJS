import { BaseKey, Entry } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from './enum';

/**
 * Generic transaction to be extended with coin specific logic.
 */
export abstract class BaseTransaction {
  protected _id: string; // The transaction id as seen in the blockchain
  protected _inputs: Entry[] = [];
  protected _outputs: Entry[] = [];
  protected _type: TransactionType;

  /**
   * Base constructor.
   *
   * @param _coinConfig BaseCoin from statics library
   */
  protected constructor(protected _coinConfig: Readonly<CoinConfig>) {}

  get id(): string {
    return this._id;
  }

  get type(): TransactionType {
    return this._type;
  }

  get outputs(): Entry[] {
    return this._outputs;
  }

  get inputs(): Entry[] {
    return this._inputs;
  }

  /**
   * Whether the private key can sign this transaction in its current state or not. it is possible
   * some transactions can only enforce this check after some other fields have been filled already
   * or even during build time.
   *
   * @param {BaseKey} key Private key to verify permissions on
   * @return {boolean} false if the key cannot sign the transaction without a doubt, true otherwise
   */
  abstract canSign(key: BaseKey): boolean;

  /**
   * Return the transaction in a coin specific JSON format.
   */
  abstract toJson(): any;

  /**
   * Return the transaction in a format it can be broadcasted to the blockchain.
   */
  abstract toBroadcastFormat(): any;
}
