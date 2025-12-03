import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32Interface } from '@bitgo/secp256k1';
import { bitgo } from '@bitgo/utxo-lib';
import debugLib from 'debug';

import { InputSigningError, TransactionSigningError } from './SigningError';

const debug = debugLib('bitgo:v2:utxo');

export type PsbtParsedScriptType =
  | 'p2sh'
  | 'p2wsh'
  | 'p2shP2wsh'
  | 'p2shP2pk'
  | 'taprootKeyPathSpend'
  | 'taprootScriptPathSpend';

/**
 * Sign all inputs of a psbt and verify signatures after signing.
 * Collects and logs signing errors and verification errors, throws error in the end if any of them
 * failed.
 *
 * If it is the last signature, finalize and extract the transaction from the psbt.
 *
 * This function mirrors signAndVerifyWalletTransaction, but is used for signing PSBTs instead of
 * using TransactionBuilder
 *
 * @param psbt
 * @param signerKeychain
 * @param isLastSignature
 */
export function signAndVerifyPsbt(
  psbt: utxolib.bitgo.UtxoPsbt,
  signerKeychain: utxolib.BIP32Interface,
  {
    isLastSignature,
    /** deprecated */
    allowNonSegwitSigningWithoutPrevTx,
  }: { isLastSignature: boolean; allowNonSegwitSigningWithoutPrevTx?: boolean }
): utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint> {
  const txInputs = psbt.txInputs;
  const outputIds: string[] = [];
  const scriptTypes: PsbtParsedScriptType[] = [];

  const signErrors: InputSigningError<bigint>[] = psbt.data.inputs
    .map((input, inputIndex: number) => {
      const outputId = utxolib.bitgo.formatOutputId(utxolib.bitgo.getOutputIdForInput(txInputs[inputIndex]));
      outputIds.push(outputId);

      const { scriptType } = utxolib.bitgo.parsePsbtInput(input);
      scriptTypes.push(scriptType);

      if (scriptType === 'p2shP2pk') {
        debug('Skipping signature for input %d of %d (RP input?)', inputIndex + 1, psbt.data.inputs.length);
        return;
      }

      try {
        psbt.signInputHD(inputIndex, signerKeychain);
        debug('Successfully signed input %d of %d', inputIndex + 1, psbt.data.inputs.length);
      } catch (e) {
        return new InputSigningError<bigint>(inputIndex, scriptType, { id: outputId }, e);
      }
    })
    .filter((e): e is InputSigningError<bigint> => e !== undefined);

  const verifyErrors: InputSigningError<bigint>[] = psbt.data.inputs
    .map((input, inputIndex) => {
      const scriptType = scriptTypes[inputIndex];
      if (scriptType === 'p2shP2pk') {
        debug(
          'Skipping input signature %d of %d (unspent from replay protection address which is platform signed only)',
          inputIndex + 1,
          psbt.data.inputs.length
        );
        return;
      }

      const outputId = outputIds[inputIndex];
      try {
        if (!psbt.validateSignaturesOfInputHD(inputIndex, signerKeychain)) {
          return new InputSigningError(inputIndex, scriptType, { id: outputId }, new Error(`invalid signature`));
        }
      } catch (e) {
        debug('Invalid signature');
        return new InputSigningError<bigint>(inputIndex, scriptType, { id: outputId }, e);
      }
    })
    .filter((e): e is InputSigningError<bigint> => e !== undefined);

  if (signErrors.length || verifyErrors.length) {
    throw new TransactionSigningError(signErrors, verifyErrors);
  }

  if (isLastSignature) {
    psbt.finalizeAllInputs();
    return psbt.extractTransaction();
  }

  return psbt;
}

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

export async function signPsbtWithMusig2Participant(
  coin: Musig2Participant,
  tx: utxolib.bitgo.UtxoPsbt,
  signerKeychain: BIP32Interface | undefined,
  params: {
    isLastSignature: boolean;
    signingStep: 'signerNonce' | 'cosignerNonce' | 'signerSignature' | undefined;
    walletId: string | undefined;
  }
): Promise<utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint>> {
  if (bitgo.isTransactionWithKeyPathSpendInput(tx)) {
    // We can only be the first signature on a transaction with taproot key path spend inputs because
    // we require the secret nonce in the cache of the first signer, which is impossible to retrieve if
    // deserialized from a hex.
    if (params.isLastSignature) {
      throw new Error('Cannot be last signature on a transaction with key path spend inputs');
    }

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

  assert(signerKeychain);
  return signAndVerifyPsbt(tx, signerKeychain, {
    isLastSignature: params.isLastSignature,
  });
}
