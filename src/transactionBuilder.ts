import { BaseCoin } from "./coin/baseCoin";
import { Transaction, Destination, Signature, Key, TransactionType, Network } from ".";
import BigNumber from "bignumber.js";


export default class TransactionBuilder {
  private transaction: Transaction;

  private fromAddrs: Array<string>;
  private destination: Array<Destination>;
  private signatures: Array<Signature>;

  constructor(private coin: BaseCoin) {
    this.coin = coin;

    this.fromAddrs = new Array<string>();
    this.destination = new Array<Destination>();
    this.signatures = new Array<Signature>();
  }

  from(rawTransaction: any, transactionType: TransactionType) {
    let transaction = this.coin.parseTransaction(rawTransaction, transactionType);
    if (!transaction.isValid()) {
      throw new Error(`Transaction is not valid for ${this.coin.displayName}`);
    }

    this.transaction = transaction;
  }
 
  /**
   * Signs the transaction in our builder.
   * @param privateKey 
   * @param fromAddress 
   */
  sign(privateKey: Key, fromAddress: string) {
    if (!this.coin.validateAddress(fromAddress)) {
      throw new Error(`${fromAddress} is not valid for ${this.coin.displayName}`);
    }

    if (!privateKey.isValid()) {
      throw new Error(`Key is not valid for ${fromAddress}`);
    }

    let sig = this.coin.sign(privateKey, fromAddress, this.transaction);
    if (!sig.isValid()) {
      throw new Error(`Signature is not valid for ${fromAddress}`);
    }

    this.signatures.push(sig);
  }

  build(): Transaction {
    let transaction = this.coin.buildTransaction(this.transaction);
    if (!transaction.isValid()) {
      throw new Error(`Transaction is not valid for ${this.coin.displayName}`);
    }

    this.transaction = transaction;

    return this.transaction;
  }

  addFrom(address: string) {
    if (this.coin.maxFrom + 1 > this.from.length) {
      throw new Error(`${this.coin.displayName} does not support more than ${this.coin.maxFrom} senders`);
    }

    if (!this.coin.validateAddress(address)) {
      throw new Error(`${address} is not valid for ${this.coin.displayName}`);
    }
    
    this.fromAddrs.push(address);
  }

  addDestination(address: string, value: BigNumber) {
    if (this.coin.maxDestinations + 1 > this.destination.length) {
      throw new Error(`${this.coin.displayName} does not support more than ${this.coin.maxFrom} destinations`);
    }

    if (!this.coin.validateAddress(address)) {
      throw new Error(`${address} is not valid for ${this.coin.displayName}`);
    }

    this.destination.push(new Destination(address, value));
  }
}
