export interface CoinWithSignableConsistency {
  /**
   * Verify that the server-supplied signableHex is consistent with serializedTxHex.
   * For TSS_VERIFY_USE_SERIALIZED_TX_HEX coins (BSC, XDC), the MPC signing flow
   * verifies serializedTxHex but signs signableHex — both are server-supplied
   * independently.  This method derives the expected signableHex from the
   * serializedTxHex locally and throws InvalidTransactionError if they diverge.
   */
  assertSignableConsistency(serializedTxHex: string, signableHex: string): void;
}

export function isCoinWithSignableConsistency(coin: unknown): coin is CoinWithSignableConsistency {
  return (
    coin !== null &&
    typeof coin === 'object' &&
    typeof (coin as CoinWithSignableConsistency).assertSignableConsistency === 'function'
  );
}
