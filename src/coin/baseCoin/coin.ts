import { AccountNetwork, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import BigNumber from "bignumber.js";
import { BaseAddress, BaseKey } from "./iface";
import { BaseTransaction } from "../../transaction";

export abstract class BaseCoin {
  /**
   * Our coin from statics
   */
  protected staticsCoin: Readonly<StaticsBaseCoin>;
  protected _network: AccountNetwork;

  /**
   * Constructor
   * @param network the network for this coin
   */
  constructor(network: AccountNetwork) {
    this._network = network;
  }

  /**
   * The statics fullName of this coin
   */
  abstract get displayName(): string;

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
   */
  public abstract parseTransaction(rawTransaction: any): BaseTransaction;

  /**
   * Build our transaction. Returns the resultant transaction with a completed transaction (or error state)
   * @param transaction
   */
  public abstract buildTransaction(transaction: BaseTransaction): BaseTransaction;

  /**
   * Sign a transaction. Creates and attaches a signature to this transaction.
   * @param privateKey the private key associated with this signing mechanism
   * @param address the address we're signing from
   * @param transaction our txBuilder's transaction typically
   */
  public abstract sign(privateKey: BaseKey, address: BaseAddress, transaction: BaseTransaction): BaseTransaction;
}
