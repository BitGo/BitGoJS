import assert from 'assert';

import { isTriple } from '@bitgo/sdk-core';
import _ from 'lodash';
import { BIP32, bip32, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { UtxoCoinName } from '../../names';
import type { Unspent } from '../../unspent';

import { Musig2Participant } from './musig2';
import { signPsbtWithMusig2ParticipantWasm, signAndVerifyPsbtWasm, ReplayProtectionKeys } from './signPsbtWasm';
import { getReplayProtectionPubkeys } from './replayProtection';

export function signAndVerifyPsbt(
  psbt: fixedScriptWallet.BitGoPsbt,
  signerKeychain: bip32.BIP32Interface | BIP32,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys,
  replayProtection: ReplayProtectionKeys,
  options: { writeSignedWith?: boolean } = {}
): fixedScriptWallet.BitGoPsbt {
  assert(rootWalletKeys, 'rootWalletKeys required for wasm-utxo signing');
  assert(replayProtection, 'replayProtection required for wasm-utxo signing');
  return signAndVerifyPsbtWasm(psbt, signerKeychain, rootWalletKeys, replayProtection, options);
}

export async function signTransaction(
  coin: Musig2Participant<fixedScriptWallet.BitGoPsbt>,
  tx: fixedScriptWallet.BitGoPsbt,
  signerKeychain: bip32.BIP32Interface | undefined,
  coinName: UtxoCoinName,
  params: {
    walletId: string | undefined;
    txInfo: { unspents?: Unspent<bigint | number>[] } | undefined;
    isLastSignature: boolean;
    signingStep: 'signerNonce' | 'cosignerNonce' | 'signerSignature' | undefined;
    pubs: string[] | undefined;
    cosignerPub: string | undefined;
    /** When true (default), extract finalized PSBT to legacy transaction format. When false, return finalized PSBT. */
    extractTransaction?: boolean;
    writeSignedWith?: boolean;
  }
): Promise<fixedScriptWallet.BitGoPsbt | Buffer> {
  let isLastSignature = false;
  if (_.isBoolean(params.isLastSignature)) {
    // if build is called instead of buildIncomplete, no signature placeholders are left in the sig script
    isLastSignature = params.isLastSignature;
  }

  const { extractTransaction = true } = params;

  assert(params.pubs, 'pubs are required for fixed script signing');
  assert(isTriple(params.pubs), 'pubs must be a triple');
  const rootWalletKeys = fixedScriptWallet.RootWalletKeys.fromXpubs(params.pubs);
  const signedPsbt = await signPsbtWithMusig2ParticipantWasm(coin, tx, signerKeychain, rootWalletKeys, {
    replayProtection: {
      publicKeys: getReplayProtectionPubkeys(coinName),
    },
    signingStep: params.signingStep,
    walletId: params.walletId,
    writeSignedWith: params.writeSignedWith,
  });
  if (isLastSignature) {
    if (extractTransaction) {
      signedPsbt.finalizeAllInputs();
      return Buffer.from(signedPsbt.extractTransaction().toBytes());
    }
    return signedPsbt;
  }
  return signedPsbt;
}
