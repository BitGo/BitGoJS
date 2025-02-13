// UTXO is a structure defining attributes for a UTXO
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
  rawTxHex?: string; // Non-segwit or Nested SegWit
  redeemScript?: string; // For P2SH or P2SH-P2WPKH/P2WSH
  witnessScript?: string; // For P2WSH
}
