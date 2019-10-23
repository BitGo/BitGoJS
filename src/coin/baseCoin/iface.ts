import { TransactionType } from "./enum";

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
  abstract tx: any;
  transactionType: TransactionType;
}

export interface BaseKey {
  key: any;
}