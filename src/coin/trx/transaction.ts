import { DecodedTransaction } from "./iface";
import { BaseTransaction } from "../baseCoin/iface";
import { Network } from "../baseCoin/enum";

export class Transaction extends BaseTransaction {
  rawTx: any;

  parsedTx: DecodedTransaction;

  existingSignatures: Array<string>;

  /**
   * We have to get this from an external source typically as
   * it is not in the raw transaction.
   */
  txID: string;

  constructor(private network: Network) { 
    super();
  }
}
