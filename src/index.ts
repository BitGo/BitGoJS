import BigNumber from "bignumber.js";

export class Destination {
  constructor(private address: string, private value: BigNumber) {}
}

export interface Signature {
  isValid(): boolean;
}

/**
 * Specifies the members expected for a Transaction
 */
export interface Transaction {
  rawTx: any;
  parsedTx: any;

  transactionType: TransactionType;
  isValid(): boolean;
}

export interface Key {
  isValid(): boolean;
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
