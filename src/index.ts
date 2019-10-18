export class Destination {
  constructor(private address: string, private value: BigNumber) {}
}

export interface ISignature {
  isValid(): boolean;
}

/**
 * Specifies the members expected for a Transaction
 */
export interface ITransaction {
  rawTx: any;
  parsedTx: any;

  isValid(): boolean;
}

export interface IKey {
  isValid(): boolean;
}

export enum Network {
  Test,
  Main
}

export enum TransactionType {
  NotSet,
  Send,
  Recieve
}
