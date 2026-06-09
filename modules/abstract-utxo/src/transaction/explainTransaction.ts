import { fixedScriptWallet, Psbt as WasmPsbt } from '@bitgo/wasm-utxo';
import { isTriple, IWallet, Triple } from '@bitgo/sdk-core';

import { getDescriptorMapFromWallet, isDescriptorWallet } from '../descriptor';
import { toBip32Triple } from '../keychains';
import { getPolicyForEnv } from '../descriptor/validatePolicy';
import { UtxoCoinName } from '../names';
import type { Unspent } from '../unspent';

import { getReplayProtectionPubkeys } from './fixedScript/replayProtection';
import type { TransactionExplanationUtxolibPsbt, TransactionExplanationWasm } from './fixedScript/explainTransaction';
import * as fixedScript from './fixedScript';
import * as descriptor from './descriptor';

/**
 * Decompose a raw transaction into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainTx<TNumber extends number | bigint>(
  tx: fixedScriptWallet.BitGoPsbt | WasmPsbt,
  params: {
    wallet?: IWallet;
    pubs?: string[];
    customChangeXpubs?: Triple<string>;
    txInfo?: { unspents?: Unspent<TNumber>[] };
  },
  coinName: UtxoCoinName
): TransactionExplanationUtxolibPsbt | TransactionExplanationWasm {
  if (params.wallet && isDescriptorWallet(params.wallet)) {
    if (!(tx instanceof WasmPsbt)) {
      throw new Error('descriptor wallets require PSBT format transactions');
    }
    if (!params.pubs || !isTriple(params.pubs)) {
      throw new Error('pub triple is required for descriptor wallets');
    }
    const walletKeys = toBip32Triple(params.pubs);
    const descriptors = getDescriptorMapFromWallet(params.wallet, walletKeys, getPolicyForEnv(params.wallet.bitgo.env));
    return descriptor.explainPsbt(tx, descriptors, coinName);
  }
  if (tx instanceof fixedScriptWallet.BitGoPsbt) {
    const pubs = params.pubs;
    if (!pubs) {
      throw new Error('pub triple is required');
    }
    const walletXpubs: Triple<string> | undefined = isTriple(pubs) ? (pubs as Triple<string>) : undefined;
    if (!walletXpubs) {
      throw new Error('pub triple must be valid triple or RootWalletKeys');
    }
    return fixedScript.explainPsbtWasm(tx, walletXpubs, {
      replayProtection: {
        publicKeys: getReplayProtectionPubkeys(coinName),
      },
      customChangeWalletXpubs: params.customChangeXpubs,
    });
  } else if (tx instanceof WasmPsbt) {
    throw new Error('descriptor Psbt is only supported for descriptor wallets');
  } else {
    throw new Error('unsupported transaction type');
  }
}
