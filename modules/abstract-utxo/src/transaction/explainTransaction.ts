import * as utxolib from '@bitgo/utxo-lib';

import { TransactionExplanation } from '../abstractUtxoCoin';

import * as fixedScript from './fixedScript';

/**
 * Decompose a raw transaction into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainTx<TNumber extends number | bigint>(
  tx: utxolib.bitgo.UtxoTransaction<TNumber> | utxolib.bitgo.UtxoPsbt,
  params: {
    pubs?: string[];
    txInfo?: { unspents?: utxolib.bitgo.Unspent<TNumber>[] };
    changeInfo?: fixedScript.ChangeAddressInfo[];
  },
  network: utxolib.Network
): TransactionExplanation {
  if (tx instanceof utxolib.bitgo.UtxoPsbt) {
    return fixedScript.explainPsbt(tx, params, network);
  } else {
    return fixedScript.explainLegacyTx(tx, params, network);
  }
}
