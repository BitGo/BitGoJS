import assert from 'assert';

import { isTriple } from '@bitgo/sdk-core';
import _ from 'lodash';
import { bitgo } from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { BIP32, bip32, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { UtxoCoinName } from '../../names.js';
import type { Unspent } from '../../unspent.js';
import { toUtxolibBIP32 } from '../../wasmUtil.js';

import { Musig2Participant } from './musig2.js';
import { signLegacyTransaction } from './signLegacyTransaction.js';
import {
  signPsbtWithMusig2ParticipantUtxolib,
  signAndVerifyPsbt as signAndVerifyPsbtUtxolib,
} from './signPsbtUtxolib.js';
import { signPsbtWithMusig2ParticipantWasm, signAndVerifyPsbtWasm, ReplayProtectionKeys } from './signPsbtWasm.js';
import { getReplayProtectionPubkeys } from './replayProtection.js';

/**
 * Sign and verify a PSBT using either utxolib or wasm-utxo depending on the PSBT type.
 */
export function signAndVerifyPsbt(
  psbt: utxolib.bitgo.UtxoPsbt,
  signerKeychain: bip32.BIP32Interface | BIP32,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys | undefined,
  replayProtection: ReplayProtectionKeys | undefined,
  options?: { writeSignedWith?: boolean }
): utxolib.bitgo.UtxoPsbt;
export function signAndVerifyPsbt(
  psbt: fixedScriptWallet.BitGoPsbt,
  signerKeychain: bip32.BIP32Interface | BIP32,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys,
  replayProtection: ReplayProtectionKeys,
  options?: { writeSignedWith?: boolean }
): fixedScriptWallet.BitGoPsbt;
export function signAndVerifyPsbt(
  psbt: utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt,
  signerKeychain: bip32.BIP32Interface | BIP32,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys,
  replayProtection: ReplayProtectionKeys,
  options?: { writeSignedWith?: boolean }
): utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt;
export function signAndVerifyPsbt(
  psbt: utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt,
  signerKeychain: bip32.BIP32Interface | BIP32,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys | undefined,
  replayProtection: ReplayProtectionKeys | undefined,
  options: { writeSignedWith?: boolean } = {}
): utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt {
  if (psbt instanceof bitgo.UtxoPsbt) {
    return signAndVerifyPsbtUtxolib(psbt, toUtxolibBIP32(signerKeychain));
  }
  assert(rootWalletKeys, 'rootWalletKeys required for wasm-utxo signing');
  assert(replayProtection, 'replayProtection required for wasm-utxo signing');
  return signAndVerifyPsbtWasm(psbt, signerKeychain, rootWalletKeys, replayProtection, options);
}

export async function signTransaction<
  T extends utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint | number> | fixedScriptWallet.BitGoPsbt
>(
  coin: Musig2Participant<utxolib.bitgo.UtxoPsbt> | Musig2Participant<fixedScriptWallet.BitGoPsbt>,
  tx: T,
  signerKeychain: bip32.BIP32Interface | undefined,
  coinName: UtxoCoinName,
  params: {
    walletId: string | undefined;
    txInfo: { unspents?: Unspent<bigint | number>[] } | undefined;
    isLastSignature: boolean;
    signingStep: 'signerNonce' | 'cosignerNonce' | 'signerSignature' | undefined;
    /** deprecated */
    allowNonSegwitSigningWithoutPrevTx: boolean;
    pubs: string[] | undefined;
    cosignerPub: string | undefined;
    /** When true (default), extract finalized PSBT to legacy transaction format. When false, return finalized PSBT. */
    extractTransaction?: boolean;
    writeSignedWith?: boolean;
  }
): Promise<
  utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint | number> | fixedScriptWallet.BitGoPsbt | Buffer
> {
  let isLastSignature = false;
  if (_.isBoolean(params.isLastSignature)) {
    // if build is called instead of buildIncomplete, no signature placeholders are left in the sig script
    isLastSignature = params.isLastSignature;
  }

  const { extractTransaction = true } = params;

  if (tx instanceof bitgo.UtxoPsbt) {
    const signedPsbt = await signPsbtWithMusig2ParticipantUtxolib(
      coin as Musig2Participant<utxolib.bitgo.UtxoPsbt>,
      tx,
      signerKeychain ? toUtxolibBIP32(signerKeychain) : undefined,
      {
        signingStep: params.signingStep,
        walletId: params.walletId,
      }
    );
    if (isLastSignature) {
      if (extractTransaction) {
        signedPsbt.finalizeAllInputs();
        return signedPsbt.extractTransaction();
      }
      // Return signed PSBT without finalizing to preserve derivation info
      return signedPsbt;
    }
    return signedPsbt;
  } else if (tx instanceof fixedScriptWallet.BitGoPsbt) {
    assert(params.pubs, 'pubs are required for fixed script signing');
    assert(isTriple(params.pubs), 'pubs must be a triple');
    const rootWalletKeys = fixedScriptWallet.RootWalletKeys.fromXpubs(params.pubs);
    const signedPsbt = await signPsbtWithMusig2ParticipantWasm(
      coin as Musig2Participant<fixedScriptWallet.BitGoPsbt>,
      tx,
      signerKeychain,
      rootWalletKeys,
      {
        replayProtection: {
          publicKeys: getReplayProtectionPubkeys(coinName),
        },
        signingStep: params.signingStep,
        walletId: params.walletId,
        writeSignedWith: params.writeSignedWith,
      }
    );
    if (isLastSignature) {
      if (extractTransaction) {
        signedPsbt.finalizeAllInputs();
        return Buffer.from(signedPsbt.extractTransaction().toBytes());
      }
      // Return finalized PSBT without extracting to legacy format
      return signedPsbt;
    }
    return signedPsbt;
  }

  return signLegacyTransaction(tx, signerKeychain, coinName, {
    isLastSignature,
    signingStep: params.signingStep,
    txInfo: params.txInfo,
    pubs: params.pubs,
    cosignerPub: params.cosignerPub,
  });
}
