import * as utxolib from '@bitgo/utxo-lib';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import { isTriple, IWallet, Triple } from '@bitgo/sdk-core';

import { getDescriptorMapFromWallet, isDescriptorWallet } from '../descriptor/index.js';
import { toBip32Triple } from '../keychains.js';
import { getPolicyForEnv } from '../descriptor/validatePolicy.js';
import { UtxoCoinName } from '../names.js';
import type { Unspent } from '../unspent.js';
import { toWasmPsbt } from '../wasmUtil.js';

import { getReplayProtectionPubkeys } from './fixedScript/replayProtection.js';
import type {
  TransactionExplanationUtxolibLegacy,
  TransactionExplanationUtxolibPsbt,
  TransactionExplanationWasm,
} from './fixedScript/explainTransaction.js';
import * as fixedScript from './fixedScript/index.js';
import * as descriptor from './descriptor/index.js';

/**
 * Decompose a raw transaction into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainTx<TNumber extends number | bigint>(
  tx: utxolib.bitgo.UtxoTransaction<TNumber> | utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt,
  params: {
    wallet?: IWallet;
    pubs?: string[];
    customChangeXpubs?: Triple<string>;
    txInfo?: { unspents?: Unspent<TNumber>[] };
    changeInfo?: fixedScript.ChangeAddressInfo[];
  },
  coinName: UtxoCoinName
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
      return descriptor.explainPsbt(toWasmPsbt(tx), descriptors, coinName);
    }

    throw new Error('legacy transactions are not supported for descriptor wallets');
  }
  if (tx instanceof utxolib.bitgo.UtxoPsbt) {
    return fixedScript.explainPsbt(tx, { ...params, customChangePubs: params.customChangeXpubs }, coinName);
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
        publicKeys: getReplayProtectionPubkeys(coinName),
      },
      customChangeWalletXpubs: params.customChangeXpubs,
    });
  } else {
    return fixedScript.explainLegacyTx(tx, params, coinName);
  }
}
