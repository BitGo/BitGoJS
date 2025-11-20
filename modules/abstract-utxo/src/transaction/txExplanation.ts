import { AbstractUtxoCoin, TransactionPrebuild } from '../abstractUtxoCoin';

/**
 * Generate a stringified transaction explanation for error reporting
 * @param coin - The UTXO coin instance
 * @param txPrebuild - Transaction prebuild containing txHex and txInfo
 * @returns Stringified JSON explanation
 */
export async function getTxExplanation<TNumber extends number | bigint>(
  coin: AbstractUtxoCoin,
  txPrebuild: TransactionPrebuild<TNumber>
): Promise<string | undefined> {
  if (!txPrebuild.txHex) {
    return undefined;
  }

  try {
    const explanation = await coin.explainTransaction({
      txHex: txPrebuild.txHex,
      txInfo: txPrebuild.txInfo,
    });
    return JSON.stringify(explanation, null, 2);
  } catch (e) {
    const errorDetails = {
      error: 'Failed to parse transaction explanation',
      txHex: txPrebuild.txHex,
      details: e instanceof Error ? e.message : String(e),
    };
    return JSON.stringify(errorDetails, null, 2);
  }
}
