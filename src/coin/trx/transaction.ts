import { RawTransaction, TransactionReceipt } from "./iface";
import { BaseTransaction } from "../baseCoin/iface";
import { NetworkType } from "@bitgo/statics";

export class Transaction extends BaseTransaction {
  /**
   * This is what is passed into a from in transactionBuilder.
   */
  rawTx: any;

  /**
   * This is what is signed and comes out tansactionBuilder build().
   */
  finalTx: any;

  /**
   * Output of parsed transaction.
   */
  tx: TransactionReceipt;

  constructor(private network: NetworkType) {
    super();
  }
}
