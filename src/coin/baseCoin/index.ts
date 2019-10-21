import { coins, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import BigNumber from "bignumber.js";
import { BaseAddress, BaseKey, BaseTransaction, BaseSignature } from "./iface";
import { Network, TransactionType } from './enum';

export abstract class BaseCoin {
  /**
   * Our coin from statics
   */
  protected staticsCoin: Readonly<StaticsBaseCoin>;

  /**
   * Constructor
   * @param network the network for this coin
   */
  constructor(public network: Network) { }

  /**
   * The statics fullName of this coin
   */
  abstract get displayName(): string;

  /**
   * This is the maximum senders this coin can have for a given transaction.
   */
  abstract get maxFrom(): number;

  /**
   * This is the maximum destinations this coin can have for a given transaction.
   */
  abstract get maxDestinations(): number;

  /**
   * Validate an address. Throws an exception if invalid.
   * @param address the address
   * @param addressFormat the address format - this will be handled by the implementing coin as an enum
   */
  public abstract validateAddress(address: BaseAddress, addressFormat?: string);

  /***
   * Validates the value corresponding to an amount can be used for this transaction. Throws an exception if invalid.
   */
  public abstract validateValue(value: BigNumber);

  /***
   * Validates a private key.
   */
  public abstract validateKey(key: BaseKey);

  /**
   * Parse a transaction from a raw format.
   * @param rawTransaction the raw transaction in this case. format determined by the coin
   * @param transactionType the type/direction of the transaction
   */
  public abstract parseTransaction(rawTransaction: any, transactionType: TransactionType): BaseTransaction;

  /**
   * Build our transaction. Returns the resultant transaction with a completed transaction (or error state)
   * @param transaction 
   */
  public abstract buildTransaction(transaction: BaseTransaction): BaseTransaction;

  /**
   * Sign a transaction. Returns a signature or a signature with invalid state.
   * @param privateKey the private key associated with this signing mechanism
   * @param address 
   * @param transaction the transaction 
   */
  public abstract sign(privateKey: BaseKey, address: BaseAddress, transaction: BaseTransaction): BaseSignature;
}
