import { BaseCoin } from "./coin/baseCoin";
import { BaseTransaction, Destination, BaseSignature, BaseKey, TransactionType, Network, BaseAddress } from ".";
import BigNumber from "bignumber.js";
import { SigningError } from "./coin/baseCoin/errors";


export default class TransactionBuilder {
  private transaction: BaseTransaction;

  private fromAddresses: Array<BaseAddress>;
  private destination: Array<Destination>;
  private signatures: Array<BaseSignature>;

  constructor(private coin: BaseCoin) {
    this.coin = coin;

    this.fromAddresses = new Array<BaseAddress>();
    this.destination = new Array<Destination>();
    this.signatures = new Array<BaseSignature>();
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

    let sig = this.coin.sign(key, fromAddress, this.transaction);
    
    this.signatures.push(sig);
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
