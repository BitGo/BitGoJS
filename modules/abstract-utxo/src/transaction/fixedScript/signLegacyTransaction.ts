import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { bitgo } from '@bitgo/utxo-lib';
import { isTriple, Triple } from '@bitgo/sdk-core';
import { BIP32, bip32 } from '@bitgo/wasm-utxo';
import debugLib from 'debug';

import { UtxoCoinName } from '../../names';
import type { Unspent, WalletUnspent } from '../../unspent';
import { toUtxolibBIP32 } from '../../wasmUtil';

import { getReplayProtectionAddresses } from './replayProtection';
import { InputSigningError, TransactionSigningError } from './SigningError';

const debug = debugLib('bitgo:v2:utxo');

const { isWalletUnspent, signInputWithUnspent, toOutput } = utxolib.bitgo;

type RootWalletKeys = utxolib.bitgo.RootWalletKeys;

/**
 * Sign all inputs of a wallet transaction and verify signatures after signing.
 * Collects and logs signing errors and verification errors, throws error in the end if any of them
 * failed.
 *
 * @param transaction - wallet transaction (builder) to be signed
 * @param unspents - transaction unspents
 * @param walletSigner - signing parameters
 * @param coinName - coin name for network-specific logic
 * @param isLastSignature - Returns full-signed transaction when true. Builds half-signed when false.
 * @param replayProtectionAddresses - List of replay protection addresses to skip signing
 */
export function signAndVerifyWalletTransaction<TNumber extends number | bigint>(
  transaction: utxolib.bitgo.UtxoTransaction<TNumber> | utxolib.bitgo.UtxoTransactionBuilder<TNumber>,
  unspents: Unspent<TNumber>[],
  walletSigner: utxolib.bitgo.WalletUnspentSigner<RootWalletKeys>,
  coinName: UtxoCoinName,
  {
    isLastSignature,
    replayProtectionAddresses,
  }: {
    isLastSignature: boolean;
    replayProtectionAddresses?: string[];
  }
): utxolib.bitgo.UtxoTransaction<TNumber> {
  const network = transaction.network as utxolib.Network;
  if (replayProtectionAddresses === undefined) {
    replayProtectionAddresses = getReplayProtectionAddresses(coinName);
  }
  const prevOutputs = unspents.map((u) => toOutput(u, network));

  let txBuilder: utxolib.bitgo.UtxoTransactionBuilder<TNumber>;
  if (transaction instanceof utxolib.bitgo.UtxoTransaction) {
    txBuilder = utxolib.bitgo.createTransactionBuilderFromTransaction<TNumber>(transaction, prevOutputs);
    if (transaction.ins.length !== unspents.length) {
      throw new Error(`transaction inputs must match unspents`);
    }
  } else if (transaction instanceof utxolib.bitgo.UtxoTransactionBuilder) {
    txBuilder = transaction;
  } else {
    throw new Error(`must pass UtxoTransaction or UtxoTransactionBuilder`);
  }

  const signErrors: InputSigningError<TNumber>[] = unspents
    .map((unspent: Unspent<TNumber>, inputIndex: number) => {
      if (replayProtectionAddresses.includes(unspent.address)) {
        debug('Skipping signature for input %d of %d (RP input?)', inputIndex + 1, unspents.length);
        return;
      }
      if (!isWalletUnspent<TNumber>(unspent)) {
        return InputSigningError.expectedWalletUnspent<TNumber>(inputIndex, null, unspent);
      }
      try {
        signInputWithUnspent<TNumber>(txBuilder, inputIndex, unspent as WalletUnspent<TNumber>, walletSigner);
        debug('Successfully signed input %d of %d', inputIndex + 1, unspents.length);
      } catch (e) {
        return new InputSigningError<TNumber>(inputIndex, null, unspent, e);
      }
    })
    .filter((e): e is InputSigningError<TNumber> => e !== undefined);

  const signedTransaction = isLastSignature ? txBuilder.build() : txBuilder.buildIncomplete();

  const verifyErrors: InputSigningError<TNumber>[] = signedTransaction.ins
    .map((input, inputIndex) => {
      const unspent = unspents[inputIndex] as Unspent<TNumber>;
      if (replayProtectionAddresses.includes(unspent.address)) {
        debug(
          'Skipping input signature %d of %d (unspent from replay protection address which is platform signed only)',
          inputIndex + 1,
          unspents.length
        );
        return;
      }
      if (!isWalletUnspent<TNumber>(unspent)) {
        return InputSigningError.expectedWalletUnspent<TNumber>(inputIndex, null, unspent);
      }
      const walletUnspent = unspent as WalletUnspent<TNumber>;
      try {
        const publicKey = walletSigner.deriveForChainAndIndex(walletUnspent.chain, walletUnspent.index).signer
          .publicKey;
        if (
          !utxolib.bitgo.verifySignatureWithPublicKey<TNumber>(signedTransaction, inputIndex, prevOutputs, publicKey)
        ) {
          return new InputSigningError(inputIndex, null, unspent, new Error(`invalid signature`));
        }
      } catch (e) {
        debug('Invalid signature');
        return new InputSigningError<TNumber>(inputIndex, null, unspent, e);
      }
    })
    .filter((e): e is InputSigningError<TNumber> => e !== undefined);

  if (signErrors.length || verifyErrors.length) {
    throw new TransactionSigningError(signErrors, verifyErrors);
  }

  return signedTransaction;
}

export function signLegacyTransaction<TNumber extends number | bigint>(
  tx: utxolib.bitgo.UtxoTransaction<TNumber>,
  signerKeychain: bip32.BIP32Interface | undefined,
  coinName: UtxoCoinName,
  params: {
    isLastSignature: boolean;
    signingStep: 'signerNonce' | 'cosignerNonce' | 'signerSignature' | undefined;
    txInfo: { unspents?: Unspent<TNumber>[] } | undefined;
    pubs: string[] | undefined;
    cosignerPub: string | undefined;
  }
): utxolib.bitgo.UtxoTransaction<TNumber> {
  switch (params.signingStep) {
    case 'signerNonce':
    case 'cosignerNonce':
      /**
       * In certain cases, the caller of this method may not know whether the txHex contains a psbt with taproot key path spend input(s).
       * Instead of throwing error, no-op and return the txHex. So that the caller can call this method in the same sequence.
       */
      return tx;
  }

  if (tx.ins.length !== params.txInfo?.unspents?.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  if (!params.pubs || !isTriple(params.pubs)) {
    throw new Error(`must provide xpub array`);
  }

  const keychains = params.pubs.map((pub) => toUtxolibBIP32(BIP32.fromBase58(pub))) as Triple<utxolib.BIP32Interface>;
  const cosignerPub = params.cosignerPub ?? params.pubs[2];
  const cosignerKeychain = toUtxolibBIP32(BIP32.fromBase58(cosignerPub));

  assert(signerKeychain);
  const walletSigner = new bitgo.WalletUnspentSigner<RootWalletKeys>(
    keychains,
    toUtxolibBIP32(signerKeychain),
    cosignerKeychain
  );
  return signAndVerifyWalletTransaction(tx, params.txInfo.unspents, walletSigner, coinName, {
    isLastSignature: params.isLastSignature,
  }) as utxolib.bitgo.UtxoTransaction<TNumber>;
}
