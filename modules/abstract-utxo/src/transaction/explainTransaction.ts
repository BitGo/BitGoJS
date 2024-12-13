import * as utxolib from '@bitgo/utxo-lib';

import { TransactionExplanation } from '../abstractUtxoCoin';

import * as fixedScript from './fixedScript';
import * as descriptor from './descriptor';

import { isTriple, IWallet } from '@bitgo/sdk-core';
import { getDescriptorMapFromWallet, isDescriptorWallet } from '../descriptor';
import { toBip32Triple } from '../keychains';
import { getPolicyForEnv } from '../descriptor/validatePolicy';

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
    if (tx instanceof utxolib.bitgo.UtxoPsbt) {
      if (!params.pubs || !isTriple(params.pubs)) {
        throw new Error('pub triple is required for descriptor wallets');
      }
      const walletKeys = toBip32Triple(params.pubs);
      const descriptors = getDescriptorMapFromWallet(
        params.wallet,
        walletKeys,
        getPolicyForEnv(params.wallet.bitgo.env)
      );
      return descriptor.explainPsbt(tx, descriptors);
    }

    throw new Error('legacy transactions are not supported for descriptor wallets');
  }
  if (tx instanceof utxolib.bitgo.UtxoPsbt) {
    return fixedScript.explainPsbt(tx, params, network);
  } else {
    return fixedScript.explainLegacyTx(tx, params, network);
  }
}
