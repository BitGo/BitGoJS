import { BaseCoin } from "../baseCoin";
import { Network, ITransaction, ISignature, IKey } from "../..";
import { coins } from '@bitgo/statics';
import BigNumber from "bignumber.js";

export default class Trx extends BaseCoin {
  public buildTransaction(transaction: ITransaction): ITransaction {
    throw new Error("Method not implemented.");
  }

  public validateTransaction(transaction: ITransaction): boolean {
    throw new Error("Method not implemented.");
  }

  public validatePrivateKey(key: IKey): boolean {
    throw new Error("Method not implemented.");
  }

  public parseTransaction(rawTransaction: any): ITransaction {
    throw new Error("Method not implemented.");
  }

  public sign(privateKey: any, address: string, transaction: ITransaction): ISignature {
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
  
  public validateAddSender(address: string): boolean {
    // TODO: tbd
    return true;
  }

  public validateAddDestination(address: string, value: BigNumber): boolean {
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