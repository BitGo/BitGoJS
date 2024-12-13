import assert from 'assert';
import _ from 'lodash';
import { bip32, BIP32Interface, bitgo } from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { isTriple, Triple } from '@bitgo/sdk-core';
import buildDebug from 'debug';

import { signAndVerifyPsbt, signAndVerifyWalletTransaction } from '../../sign';
import { AbstractUtxoCoin, DecodedTransaction, RootWalletKeys } from '../../abstractUtxoCoin';

const debug = buildDebug('bitgo:abstract-utxo:signTransaction');

/**
 * Key Value: Unsigned tx id => PSBT
 * It is used to cache PSBTs with taproot key path (MuSig2) inputs during external express signer is activated.
 * Reason: MuSig2 signer secure nonce is cached in the UtxoPsbt object. It will be required during the signing step.
 * For more info, check SignTransactionOptions.signingStep
 *
 * TODO BTC-276: This cache may need to be done with LRU like memory safe caching if memory issues comes up.
 */
const PSBT_CACHE = new Map<string, utxolib.bitgo.UtxoPsbt>();

export async function signTransaction<TNumber extends number | bigint>(
  coin: AbstractUtxoCoin,
  tx: DecodedTransaction<TNumber>,
  params: {
    walletId: string | undefined;
    txInfo: { unspents?: utxolib.bitgo.Unspent<TNumber>[] } | undefined;
    isLastSignature: boolean;
    prv: string | undefined;
    signingStep: 'signerNonce' | 'cosignerNonce' | 'signerSignature' | undefined;
    allowNonSegwitSigningWithoutPrevTx: boolean;
    pubs: string[] | undefined;
    cosignerPub: string | undefined;
  }
): Promise<{ txHex: string }> {
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

  const getSignerKeychain = (): utxolib.BIP32Interface => {
    const userPrv = params.prv;
    if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
      if (!_.isUndefined(userPrv)) {
        throw new Error(`prv must be a string, got type ${typeof userPrv}`);
      }
      throw new Error('missing prv parameter to sign transaction');
    }
    const signerKeychain = bip32.fromBase58(userPrv, utxolib.networks.bitcoin);
    if (signerKeychain.isNeutered()) {
      throw new Error('expected user private key but received public key');
    }
    debug(`Here is the public key of the xprv you used to sign: ${signerKeychain.neutered().toBase58()}`);
    return signerKeychain;
  };

  const setSignerMusigNonceWithOverride = (
    psbt: utxolib.bitgo.UtxoPsbt,
    signerKeychain: utxolib.BIP32Interface,
    nonSegwitOverride: boolean
  ) => {
    utxolib.bitgo.withUnsafeNonSegwit(psbt, () => psbt.setAllInputsMusig2NonceHD(signerKeychain), nonSegwitOverride);
  };

  let signerKeychain: utxolib.BIP32Interface | undefined;

  if (tx instanceof bitgo.UtxoPsbt && isTxWithKeyPathSpendInput) {
    switch (params.signingStep) {
      case 'signerNonce':
        signerKeychain = getSignerKeychain();
        setSignerMusigNonceWithOverride(tx, signerKeychain, params.allowNonSegwitSigningWithoutPrevTx);
        PSBT_CACHE.set(tx.getUnsignedTx().getId(), tx);
        return { txHex: tx.toHex() };
      case 'cosignerNonce':
        assert(params.walletId, 'walletId is required for MuSig2 bitgo nonce');
        return { txHex: (await coin.signPsbt(tx.toHex(), params.walletId)).psbt };
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
        signerKeychain = getSignerKeychain();
        setSignerMusigNonceWithOverride(tx, signerKeychain, params.allowNonSegwitSigningWithoutPrevTx);
        const response = await coin.signPsbt(tx.toHex(), params.walletId);
        tx.combine(bitgo.createPsbtFromHex(response.psbt, coin.network));
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
        return { txHex: tx.toHex() };
    }
  }

  if (signerKeychain === undefined) {
    signerKeychain = getSignerKeychain();
  }

  let signedTransaction: bitgo.UtxoTransaction<bigint> | bitgo.UtxoPsbt;
  if (tx instanceof bitgo.UtxoPsbt) {
    signedTransaction = signAndVerifyPsbt(tx, signerKeychain, {
      isLastSignature,
      allowNonSegwitSigningWithoutPrevTx: params.allowNonSegwitSigningWithoutPrevTx,
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

    const walletSigner = new bitgo.WalletUnspentSigner<RootWalletKeys>(keychains, signerKeychain, cosignerKeychain);
    signedTransaction = signAndVerifyWalletTransaction(tx, params.txInfo.unspents, walletSigner, {
      isLastSignature,
    }) as bitgo.UtxoTransaction<bigint>;
  }

  return {
    txHex: signedTransaction.toBuffer().toString('hex'),
  };
}
