import * as utxolib from '@bitgo/utxo-lib';

import { TransactionExplanation } from '../abstractUtxoCoin';

import * as fixedScript from './fixedScript';

import { IWallet } from '@bitgo/sdk-core';
import { isDescriptorWallet } from '../descriptor';

/**
 * Decompose a raw transaction into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainTx<TNumber extends number | bigint>(
  tx: utxolib.bitgo.UtxoTransaction<TNumber> | utxolib.bitgo.UtxoPsbt,
  params: {
    wallet?: IWallet;
    pubs?: string[];
    txInfo?: { unspents?: utxolib.bitgo.Unspent<TNumber>[] };
    changeInfo?: fixedScript.ChangeAddressInfo[];
  },
  network: utxolib.Network
): TransactionExplanation {
  if (params.wallet && isDescriptorWallet(params.wallet)) {
    throw new Error('Descriptor wallets are not supported');
  }
  if (tx instanceof utxolib.bitgo.UtxoPsbt) {
    return fixedScript.explainPsbt(tx, params, network);
  } else {
    return fixedScript.explainLegacyTx(tx, params, network);
  }
}
