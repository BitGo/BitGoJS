export interface TransactionApi {
  /**
   * @param txid
   * @return transaction hex string
   */
  getTransactionHex(txid: string): Promise<string>;
}
