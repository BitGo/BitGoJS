import assert from 'assert';

import { isTriple } from '@bitgo/sdk-core';
import _ from 'lodash';
import { BIP32Interface } from '@bitgo/secp256k1';
import { bitgo } from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { Musig2Participant } from './musig2';
import { signLegacyTransaction } from './signLegacyTransaction';
import { signPsbtWithMusig2ParticipantUtxolib } from './signPsbtUtxolib';
import { signPsbtWithMusig2ParticipantWasm } from './signPsbtWasm';
import { getReplayProtectionPubkeys } from './replayProtection';

export async function signTransaction<
  T extends utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint | number> | fixedScriptWallet.BitGoPsbt
>(
  coin: Musig2Participant<utxolib.bitgo.UtxoPsbt> | Musig2Participant<fixedScriptWallet.BitGoPsbt>,
  tx: T,
  signerKeychain: BIP32Interface | undefined,
  network: utxolib.Network,
  params: {
    walletId: string | undefined;
    txInfo: { unspents?: utxolib.bitgo.Unspent<bigint | number>[] } | undefined;
    isLastSignature: boolean;
    signingStep: 'signerNonce' | 'cosignerNonce' | 'signerSignature' | undefined;
    /** deprecated */
    allowNonSegwitSigningWithoutPrevTx: boolean;
    pubs: string[] | undefined;
    cosignerPub: string | undefined;
  }
): Promise<
  utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint | number> | fixedScriptWallet.BitGoPsbt | Buffer
> {
  let isLastSignature = false;
  if (_.isBoolean(params.isLastSignature)) {
    // if build is called instead of buildIncomplete, no signature placeholders are left in the sig script
    isLastSignature = params.isLastSignature;
  }

  if (tx instanceof bitgo.UtxoPsbt) {
    const signedPsbt = await signPsbtWithMusig2ParticipantUtxolib(
      coin as Musig2Participant<utxolib.bitgo.UtxoPsbt>,
      tx,
      signerKeychain,
      {
        signingStep: params.signingStep,
        walletId: params.walletId,
      }
    );
    if (isLastSignature) {
      signedPsbt.finalizeAllInputs();
      return signedPsbt.extractTransaction();
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
          publicKeys: getReplayProtectionPubkeys(network),
        },
        signingStep: params.signingStep,
        walletId: params.walletId,
      }
    );
    if (isLastSignature) {
      signedPsbt.finalizeAllInputs();
      return Buffer.from(signedPsbt.extractTransaction());
    }
    return signedPsbt;
  }

  return signLegacyTransaction(tx, signerKeychain, {
    isLastSignature,
    signingStep: params.signingStep,
    txInfo: params.txInfo,
    pubs: params.pubs,
    cosignerPub: params.cosignerPub,
  });
}
