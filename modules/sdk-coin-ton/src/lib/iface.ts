/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  sender: string;
  destination: string;
  amount: string;
  seqno: number;
  expirationTime: number;
  publicKey: string;
  signature: string;
}
