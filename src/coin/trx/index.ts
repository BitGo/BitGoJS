import { BaseCoin } from "../baseCoin";
import { Network, Transaction, Signature, Key } from "../..";
import { coins } from '@bitgo/statics';
import BigNumber from "bignumber.js";

export default class Trx extends BaseCoin {
  public buildTransaction(transaction: Transaction): Transaction {
    throw new Error("Method not implemented.");
  }

  public validateTransaction(transaction: Transaction): boolean {
    throw new Error("Method not implemented.");
  }

  public validatePrivateKey(key: Key): boolean {
    throw new Error("Method not implemented.");
  }

  public parseTransaction(rawTransaction: any): Transaction {
    throw new Error("Method not implemented.");
  }

  public sign(privateKey: any, address: string, transaction: Transaction): Signature {
    throw new Error("Method not implemented.");
  }
  
  public validateValue(value: BigNumber): boolean {
    // TODO: tbd
    return true;
  }

  public validateAddress(address: string): boolean {
    // TODO: tbd
    return true;
  }

  get displayName(): string {
    return this.staticsCoin.fullName;
  }

  get maxFrom(): number {
    return 1;
  }

  get maxDestinations(): number {
    return 1;
  }

  constructor(networkType: Network) {
    super(networkType);

    if (networkType === Network.Main) {
      this.staticsCoin = coins.get('TRX');
    } else if (networkType === Network.Test) {
      this.staticsCoin = coins.get('TTRX');
    }
  }

}