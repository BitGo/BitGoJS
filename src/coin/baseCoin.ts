import { Network, ITransaction, ISignature, IKey, TransactionType } from "..";
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import BigNumber from "bignumber.js";

export abstract class BaseCoin {
  public network: Network;
  protected staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(network: Network) {
    this.network = network;
  }

  // Getters
  abstract get displayName(): string;
  abstract get maxFrom(): number;
  abstract get maxDestinations(): number;

  // Validation helpers
  public abstract validateAddress(address: string): boolean;
  public abstract validateValue(value: BigNumber): boolean;
  public abstract validateAddDestination(address: string, value: BigNumber): boolean;
  public abstract validateAddSender(address: string): boolean;

  // Parse & build
  public abstract parseTransaction(rawTransaction: any, transactionType: TransactionType): ITransaction;
  public abstract buildTransaction(transaction: ITransaction, transactionType: TransactionType): ITransaction;

  // Sign
  public abstract sign(privateKey: IKey, address: string, transaction: ITransaction): ISignature;
}
