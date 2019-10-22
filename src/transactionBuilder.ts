import { BaseCoin } from "./coin/baseCoin";
import BigNumber from "bignumber.js";
import { SigningError } from "./coin/baseCoin/errors";
import { BaseTransaction, BaseAddress, BaseKey } from "./coin/baseCoin/iface";
import { TransactionType } from "./coin/baseCoin/enum";


export default class TransactionBuilder {
  private transaction: BaseTransaction;

  private fromAddresses: Array<BaseAddress>;
  private destination: Array<Destination>;

  constructor(private coin: BaseCoin) {
    this.coin = coin;

    this.fromAddresses = new Array<BaseAddress>();
    this.destination = new Array<Destination>();
  }

  from(rawTransaction: any, transactionType: TransactionType) {
    let transaction = this.coin.parseTransaction(rawTransaction, transactionType);
    this.transaction = transaction;
  }
 
  /**
   * Signs the transaction in our builder.
   * @param key the key associated with this transaction
   * @param fromAddress 
   */
  sign(key: BaseKey, fromAddress: BaseAddress) {
    if (!this.coin.validateAddress(fromAddress)) {
      throw new SigningError(`${fromAddress} is not valid for ${this.coin.displayName}`);
    }

    if (!this.coin.validateKey(key)) {
      throw new SigningError(`Key is not valid for ${fromAddress}`);
    }

    this.transaction = this.coin.sign(key, fromAddress, this.transaction);
  }

  build(): BaseTransaction {
    let transaction = this.coin.buildTransaction(this.transaction);
    
    this.transaction = transaction;

    return this.transaction;
  }

  addFrom(address: BaseAddress) {
    if (this.coin.maxFrom + 1 > this.from.length) {
      throw new Error(`${this.coin.displayName} does not support more than ${this.coin.maxFrom} senders`);
    }

    if (!this.coin.validateAddress(address)) {
      throw new Error(`${address} is not valid for ${this.coin.displayName}`);
    }
    
    this.fromAddresses.push(address);
  }

  addDestination(address: BaseAddress, value: BigNumber) {
    if (this.coin.maxDestinations + 1 > this.destination.length) {
      throw new Error(`${this.coin.displayName} does not support more than ${this.coin.maxFrom} destinations`);
    }

    if (!this.coin.validateAddress(address)) {
      throw new Error(`${address} is not valid for ${this.coin.displayName}`);
    }

    this.destination.push(new Destination(address, value));
  }
}

export class Destination {
  constructor(private address: BaseAddress, private value: BigNumber) {}
}
