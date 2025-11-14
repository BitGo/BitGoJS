import * as utxolib from '@bitgo/utxo-lib';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import { isTriple, IWallet, Triple } from '@bitgo/sdk-core';

import { getDescriptorMapFromWallet, isDescriptorWallet } from '../descriptor';
import { toBip32Triple } from '../keychains';
import { getPolicyForEnv } from '../descriptor/validatePolicy';
import { getReplayProtectionOutputScripts } from '../replayProtection';

import type {
  TransactionExplanationUtxolibLegacy,
  TransactionExplanationUtxolibPsbt,
  TransactionExplanationWasm,
} from './fixedScript/explainTransaction';
import * as fixedScript from './fixedScript';
import * as descriptor from './descriptor';

/**
 * Decompose a raw transaction into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainTx<TNumber extends number | bigint>(
  tx: utxolib.bitgo.UtxoTransaction<TNumber> | utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt,
  params: {
    wallet?: IWallet;
    pubs?: string[];
    txInfo?: { unspents?: utxolib.bitgo.Unspent<TNumber>[] };
    changeInfo?: fixedScript.ChangeAddressInfo[];
  },
  network: utxolib.Network
): TransactionExplanationUtxolibLegacy | TransactionExplanationUtxolibPsbt | TransactionExplanationWasm {
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
  } else if (tx instanceof fixedScriptWallet.BitGoPsbt) {
    const pubs = params.pubs;
    if (!pubs) {
      throw new Error('pub triple is required');
    }
    const walletXpubs: Triple<string> | undefined =
      pubs instanceof utxolib.bitgo.RootWalletKeys
        ? (pubs.triple.map((k) => k.neutered().toBase58()) as Triple<string>)
        : isTriple(pubs)
        ? (pubs as Triple<string>)
        : undefined;
    if (!walletXpubs) {
      throw new Error('pub triple must be valid triple or RootWalletKeys');
    }
    return fixedScript.explainPsbtWasm(tx, walletXpubs, {
      replayProtection: {
        outputScripts: getReplayProtectionOutputScripts(network),
      },
    });
  } else {
    return fixedScript.explainLegacyTx(tx, params, network);
  }
}
