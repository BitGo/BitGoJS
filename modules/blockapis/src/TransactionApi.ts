export type TransactionStatus =
  | {
      // not in mempool, not confirmed
      found: false;
    }
  | {
      // found but not confirmed
      found: true;
      confirmed: false;
    }
  | {
      // found and confirmed
      found: true;
      confirmed: true;
      /** Block height. Undefined for unconfirmed transactions */
      blockHeight: number;
      /** Not available for all APIs */
      blockHash?: string;
      /** Confirmation date. Not available for all APIs. */
      date?: Date;
    };

export interface TransactionApi {
  /**
   * @param txid
   * @return transaction hex string
   */
  getTransactionHex(txid: string): Promise<string>;

  /**
   * @param txid
   * @return BlockInfo if found, undefined otherwise
   */
  getTransactionStatus(txid: string): Promise<TransactionStatus>;
}
