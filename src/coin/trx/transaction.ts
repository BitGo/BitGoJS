import { BaseTransaction, TransactionType } from "../..";
import { DecodedTransaction } from "./iface";

export class Transaction implements BaseTransaction {
  constructor() {
    this.failedParse = false;
  }

  rawTx: any;

  parsedTx: DecodedTransaction;

  transactionType: TransactionType;

  existingSignatures: Array<string>;

  failedParse: boolean;

  /**
   * We have to get this from an external source.
   */
  txID: string;

  isValid(): boolean {
    return !this.failedParse;
  }
}
