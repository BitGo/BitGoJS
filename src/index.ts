import BigNumber from "bignumber.js";

export class Destination {
  constructor(private address: BaseAddress, private value: BigNumber) {}
}

export interface BaseAddress { 
  address: any;

  toString(): string;
}

export interface BaseSignature { 
  signature: any;
}

/**
 * Specifies the members expected for a Transaction
 */
export abstract class BaseTransaction {
  abstract rawTx: any;
  abstract parsedTx: any;
  transactionType: TransactionType;
}

export interface BaseKey {
  key: any;
}

export enum Network {
  Test,
  Main,
}

export enum TransactionType {
  Send,
  Recieve,
  WalletInitialization,
}
