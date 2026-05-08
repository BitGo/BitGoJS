import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, Entry } from './iface';
import { TransactionType } from './enum';
import { NotImplementedError } from './errors';

/**
 * Generic transaction to be extended with coin specific logic.
 */
export abstract class BaseTransaction {
  protected _id: string | undefined; // The transaction id as seen in the blockchain
  protected _inputs: Entry[];
  protected _outputs: Entry[];
  protected _type: TransactionType | undefined;
  protected _signatures: string[];
  protected _coinConfig: Readonly<CoinConfig>;
  /**
   * Base constructor.
   *
   * @param _coinConfig BaseCoin from statics library
   */
  protected constructor(_coinConfig: Readonly<CoinConfig>) {
    this._coinConfig = _coinConfig;
    this._inputs = [];
    this._outputs = [];
    this._signatures = [];
    this._id = undefined;
    this._type = undefined;
  }

  /**
   * Get the transaction id as seen in the blockchain. Transactions computed offline may not have an
   * id, however, this is left to the coin implementation.
   */
  get id(): string {
    return this._id as string;
  }

  /**
   * One of {@link TransactionType}
   */
  get type(): TransactionType {
    return this._type as TransactionType;
  }

  /**
   * Get the list of outputs. Amounts are expressed in absolute value.
   */
  get outputs(): Entry[] {
    return this._outputs;
  }

  /**
   * Get the list of inputs. Amounts are expressed in absolute value.
   */
  get inputs(): Entry[] {
    return this._inputs;
  }

  /**
   * Get the list of signatures (if any) produced for this transaction.
   */
  get signature(): string[] {
    return this._signatures;
  }

  /**
   * Whether the private key can sign this transaction in its current state or not. it is possible
   * some transactions can only enforce this check after some other fields have been filled already
   * or even during build time.
   *
   * @param {BaseKey} key Private key to verify permissions on
   * @returns {boolean} false if the key cannot sign the transaction without a doubt, true otherwise
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

  /**
   * Returns the portion of the transaction that needs to be signed in Buffer format.
   * Only needed for coins that support adding signatures directly (e.g. TSS).
   */
  get signablePayload(): Buffer {
    throw new NotImplementedError('signablePayload not implemented');
  }

  /**
   * Explain/parse a given coin transaction
   * TODO: Move all previous explainTransactions from 'core' to 'account-lib' for other coins,
   * TODO: convert to abstract
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  explainTransaction(): any {}
}
