export interface UTXO {
    txid: string;
    vout: number;
    value: number;
    scriptPubKey: string;
    rawTxHex?: string;
    redeemScript?: string;
    witnessScript?: string;
}
