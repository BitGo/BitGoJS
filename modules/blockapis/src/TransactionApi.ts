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

export interface BlockApi {
  /**
   * @param height
   * @return block hash at height
   */
  getBlockIdAtHeight(height: number): Promise<string>;

  /**
   * @param hash
   * @return transaction ids in block at height
   */
  getTransactionIds(hash: string): Promise<string[]>;
}

export async function getTransactionIdsAtHeight(api: BlockApi, height: number): Promise<string[]> {
  return api.getTransactionIds(await api.getBlockIdAtHeight(height));
}
