import _ from 'lodash';
import { BIP32Interface } from '@bitgo/secp256k1';
import { bitgo } from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';

import { DecodedTransaction } from '../types';

import { signLegacyTransaction } from './signLegacyTransaction';
import { Musig2Participant, signPsbtWithMusig2Participant } from './signPsbt';

export async function signTransaction(
  coin: Musig2Participant,
  tx: DecodedTransaction<bigint | number>,
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
): Promise<utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint | number>> {
  let isLastSignature = false;
  if (_.isBoolean(params.isLastSignature)) {
    // if build is called instead of buildIncomplete, no signature placeholders are left in the sig script
    isLastSignature = params.isLastSignature;
  }

  if (tx instanceof bitgo.UtxoPsbt) {
    return signPsbtWithMusig2Participant(coin, tx, signerKeychain, {
      isLastSignature,
      signingStep: params.signingStep,
      walletId: params.walletId,
    });
  }

  return signLegacyTransaction(tx, signerKeychain, {
    isLastSignature,
    signingStep: params.signingStep,
    txInfo: params.txInfo,
    pubs: params.pubs,
    cosignerPub: params.cosignerPub,
  });
}
