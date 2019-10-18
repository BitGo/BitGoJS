import { BaseCoin } from "../baseCoin";
import { Network, TransactionType, Transaction, Signature, Key } from "../..";
import BigNumber from "bignumber.js";

/**
 * The purpose of this coin is as stock to use for the test runner.
 */
export default class Test extends BaseCoin {
  constructor(network: Network) {
    super(network);
  }

  get displayName(): string {
    throw new Error("Method not implemented.");
  }  
  
  get maxFrom(): number {
    throw new Error("Method not implemented.");
  }

  get maxDestinations(): number {
    throw new Error("Method not implemented.");
  }

  public validateAddress(address: string): boolean {
    throw new Error("Method not implemented.");
  }

  public validateValue(value: BigNumber): boolean {
    throw new Error("Method not implemented.");
  }

  public parseTransaction(rawTransaction: any, transactionType: TransactionType): Transaction {
    throw new Error("Method not implemented.");
  }

  public buildTransaction(transaction: Transaction): Transaction {
    throw new Error("Method not implemented.");
  }

  public sign(privateKey: Key, address: string, transaction: Transaction): Signature {
    throw new Error("Method not implemented.");
  }


}