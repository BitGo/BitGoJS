import { RawTransaction } from "./iface";
import { BaseTransaction } from "../baseCoin/iface";
import { NetworkType } from "@bitgo/statics";

export class Transaction extends BaseTransaction {
  /**
   * This is what is passed into a from in transactionBuilder. 
   */
  rawTx: any;

  /**
   * Output of parsed transaction.
   */
  tx: TransactionReceipt;

  constructor(private network: NetworkType) { 
    super();
  }
}

export class TransactionReceipt {
  raw_data: RawTransaction;
  signature?: Array<string>;
  
  /**
   * We have to get this from an external source typically as
   * it is not in the raw transaction.
   */
  txID?: string;
}
