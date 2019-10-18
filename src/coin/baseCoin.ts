import { Network, Transaction, Signature, Key, TransactionType } from "..";
import { coins, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import BigNumber from "bignumber.js";

export abstract class BaseCoin {
  /**
   * The network this transaction is being built for.
   */
  public network: Network;

  /**
   * Our coin from statics
   */
  protected staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(network: Network) {
    this.network = network;
  }

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
   * Validate an address. Returns false if the address is invalid
   * @param address the address
   * @param addressFormat the address format - this will be handled by the implementing coin as an enum
   */
  public abstract validateAddress(address: string, addressFormat?: string): boolean;

  /***
   * Validates the value corresponding to an amount can be used for this transaction.
   */
  public abstract validateValue(value: BigNumber): boolean;

  /**
   * Parse a transaction from a raw format.
   * @param rawTransaction the raw transaction in this case. format determined by the coin
   * @param transactionType the type/direction of the transaction
   */
  public abstract parseTransaction(rawTransaction: any, transactionType: TransactionType): Transaction;

  /**
   * Build our transaction. Returns the resultant transaction with a completed transaction (or error state)
   * @param transaction 
   */
  public abstract buildTransaction(transaction: Transaction): Transaction;

  /**
   * Sign a transaction. Returns a signature or a signature with invalid state.
   * @param privateKey the private key associated with this signing mechanism
   * @param address 
   * @param transaction the transaction 
   */
  public abstract sign(privateKey: Key, address: string, transaction: Transaction): Signature;
}
