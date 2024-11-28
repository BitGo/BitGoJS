import * as utxolib from '@bitgo/utxo-lib';

import { ExplainTransactionOptions, TransactionExplanation } from '../abstractUtxoCoin';

import * as fixedScript from './fixedScript';

/**
 * Decompose a raw transaction into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainTx<TNumber extends number | bigint>(
  tx: utxolib.bitgo.UtxoTransaction<TNumber> | utxolib.bitgo.UtxoPsbt,
  params: ExplainTransactionOptions<TNumber>,
  network: utxolib.Network
): TransactionExplanation {
  if (tx instanceof utxolib.bitgo.UtxoPsbt) {
    return fixedScript.explainPsbt(tx, params, network);
  } else {
    return fixedScript.explainLegacyTx(tx, params, network);
  }
}
