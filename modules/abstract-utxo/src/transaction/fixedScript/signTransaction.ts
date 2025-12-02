import assert from 'assert';

import _ from 'lodash';
import { BIP32Interface, bip32 } from '@bitgo/secp256k1';
import { bitgo } from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { isTriple, Triple } from '@bitgo/sdk-core';

import { DecodedTransaction } from '../types';

import { signAndVerifyPsbt, signAndVerifyWalletTransaction } from './sign';

type RootWalletKeys = bitgo.RootWalletKeys;

export interface Musig2Participant {
  getMusig2Nonces(psbt: utxolib.bitgo.UtxoPsbt, walletId: string): Promise<utxolib.bitgo.UtxoPsbt>;
}

/**
 * Key Value: Unsigned tx id => PSBT
 * It is used to cache PSBTs with taproot key path (MuSig2) inputs during external express signer is activated.
 * Reason: MuSig2 signer secure nonce is cached in the UtxoPsbt object. It will be required during the signing step.
 * For more info, check SignTransactionOptions.signingStep
 *
 * TODO BTC-276: This cache may need to be done with LRU like memory safe caching if memory issues comes up.
 */
const PSBT_CACHE = new Map<string, utxolib.bitgo.UtxoPsbt>();

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
  const isTxWithKeyPathSpendInput = tx instanceof bitgo.UtxoPsbt && bitgo.isTransactionWithKeyPathSpendInput(tx);

  let isLastSignature = false;
  if (_.isBoolean(params.isLastSignature)) {
    // We can only be the first signature on a transaction with taproot key path spend inputs because
    // we require the secret nonce in the cache of the first signer, which is impossible to retrieve if
    // deserialized from a hex.
    if (params.isLastSignature && isTxWithKeyPathSpendInput) {
      throw new Error('Cannot be last signature on a transaction with key path spend inputs');
    }

    // if build is called instead of buildIncomplete, no signature placeholders are left in the sig script
    isLastSignature = params.isLastSignature;
  }

  if (tx instanceof bitgo.UtxoPsbt && isTxWithKeyPathSpendInput) {
    switch (params.signingStep) {
      case 'signerNonce':
        assert(signerKeychain);
        tx.setAllInputsMusig2NonceHD(signerKeychain);
        PSBT_CACHE.set(tx.getUnsignedTx().getId(), tx);
        return tx;
      case 'cosignerNonce':
        assert(params.walletId, 'walletId is required for MuSig2 bitgo nonce');
        return await coin.getMusig2Nonces(tx, params.walletId);
      case 'signerSignature':
        const txId = tx.getUnsignedTx().getId();
        const psbt = PSBT_CACHE.get(txId);
        assert(
          psbt,
          `Psbt is missing from txCache (cache size ${PSBT_CACHE.size}).
            This may be due to the request being routed to a different BitGo-Express instance that for signing step 'signerNonce'.`
        );
        PSBT_CACHE.delete(txId);
        tx = psbt.combine(tx);
        break;
      default:
        // this instance is not an external signer
        assert(params.walletId, 'walletId is required for MuSig2 bitgo nonce');
        assert(signerKeychain);
        tx.setAllInputsMusig2NonceHD(signerKeychain);
        const response = await coin.getMusig2Nonces(tx, params.walletId);
        tx = tx.combine(response);
        break;
    }
  } else {
    switch (params.signingStep) {
      case 'signerNonce':
      case 'cosignerNonce':
        /**
         * In certain cases, the caller of this method may not know whether the txHex contains a psbt with taproot key path spend input(s).
         * Instead of throwing error, no-op and return the txHex. So that the caller can call this method in the same sequence.
         */
        return tx;
    }
  }

  let signedTransaction: bitgo.UtxoTransaction<bigint> | bitgo.UtxoPsbt;
  if (tx instanceof bitgo.UtxoPsbt) {
    assert(signerKeychain);
    signedTransaction = signAndVerifyPsbt(tx, signerKeychain, {
      isLastSignature,
    });
  } else {
    if (tx.ins.length !== params.txInfo?.unspents?.length) {
      throw new Error('length of unspents array should equal to the number of transaction inputs');
    }

    if (!params.pubs || !isTriple(params.pubs)) {
      throw new Error(`must provide xpub array`);
    }

    const keychains = params.pubs.map((pub) => bip32.fromBase58(pub)) as Triple<BIP32Interface>;
    const cosignerPub = params.cosignerPub ?? params.pubs[2];
    const cosignerKeychain = bip32.fromBase58(cosignerPub);

    assert(signerKeychain);
    const walletSigner = new bitgo.WalletUnspentSigner<RootWalletKeys>(keychains, signerKeychain, cosignerKeychain);
    signedTransaction = signAndVerifyWalletTransaction(tx, params.txInfo.unspents, walletSigner, {
      isLastSignature,
    }) as bitgo.UtxoTransaction<bigint>;
  }

  return signedTransaction;
}
