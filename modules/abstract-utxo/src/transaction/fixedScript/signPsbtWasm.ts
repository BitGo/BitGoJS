import assert from 'assert';

import { BIP32, bip32, ECPair, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { toWasmBIP32 } from '../../wasmUtil';

import { BulkSigningError, InputSigningError, TransactionSigningError } from './SigningError';
import { Musig2Participant } from './musig2';

export type ReplayProtectionKeys = {
  publicKeys: (Uint8Array | ECPair)[];
};

/**
 * Key Value: Unsigned tx id => PSBT
 * It is used to cache PSBTs with taproot key path (MuSig2) inputs during external express signer is activated.
 * Reason: MuSig2 signer secure nonce is cached in the BitGoPsbt object. It will be required during the signing step.
 * For more info, check SignTransactionOptions.signingStep
 */
const PSBT_CACHE_WASM = new Map<string, fixedScriptWallet.BitGoPsbt>();

function hasKeyPathSpendInput(
  tx: fixedScriptWallet.BitGoPsbt,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys,
  replayProtection: ReplayProtectionKeys
): boolean {
  const parsed = tx.parseTransactionWithWalletKeys(rootWalletKeys, replayProtection);
  return parsed.inputs.some((input) => input.scriptType === 'p2trMusig2KeyPath');
}

/**
 * Sign all inputs of a PSBT and verify signatures after signing.
 * Uses bulk signing for performance (signs all matching inputs in one pass).
 * Collects and logs signing errors and verification errors, throws error in the end if any of them failed.
 */
export function signAndVerifyPsbtWasm(
  tx: fixedScriptWallet.BitGoPsbt,
  signerKeychain: bip32.BIP32Interface | BIP32,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys,
  replayProtection: ReplayProtectionKeys
): fixedScriptWallet.BitGoPsbt {
  const wasmSigner = toWasmBIP32(signerKeychain);

  // Bulk sign all wallet inputs (ECDSA + MuSig2) - much faster than per-input signing
  try {
    tx.sign(wasmSigner);
  } catch (e) {
    throw new BulkSigningError(e);
  }

  // Verify signatures for all signed inputs (still per-input for granular error reporting)
  const parsed = tx.parseTransactionWithWalletKeys(rootWalletKeys, replayProtection);
  const verifyErrors: InputSigningError<bigint>[] = [];

  parsed.inputs.forEach((input, inputIndex) => {
    if (input.scriptType === 'p2shP2pk') {
      // Skip replay protection inputs - they are platform signed only
      return;
    }

    const outputId = `${input.previousOutput.txid}:${input.previousOutput.vout}`;
    try {
      if (!tx.verifySignature(inputIndex, wasmSigner)) {
        verifyErrors.push(
          new InputSigningError(inputIndex, input.scriptType, { id: outputId }, new Error('invalid signature'))
        );
      }
    } catch (e) {
      verifyErrors.push(new InputSigningError<bigint>(inputIndex, input.scriptType, { id: outputId }, e));
    }
  });

  if (verifyErrors.length) {
    throw new TransactionSigningError([], verifyErrors);
  }

  return tx;
}

export async function signPsbtWithMusig2ParticipantWasm(
  coin: Musig2Participant<fixedScriptWallet.BitGoPsbt>,
  tx: fixedScriptWallet.BitGoPsbt,
  signerKeychain: bip32.BIP32Interface | undefined,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys,
  params: {
    replayProtection: ReplayProtectionKeys;
    signingStep: 'signerNonce' | 'cosignerNonce' | 'signerSignature' | undefined;
    walletId: string | undefined;
  }
): Promise<fixedScriptWallet.BitGoPsbt> {
  const wasmSigner = signerKeychain ? toWasmBIP32(signerKeychain) : undefined;

  if (hasKeyPathSpendInput(tx, rootWalletKeys, params.replayProtection)) {
    switch (params.signingStep) {
      case 'signerNonce':
        assert(wasmSigner);
        tx.generateMusig2Nonces(wasmSigner);
        PSBT_CACHE_WASM.set(tx.unsignedTxid(), tx);
        return tx;
      case 'cosignerNonce':
        assert(params.walletId, 'walletId is required for MuSig2 bitgo nonce');
        return await coin.getMusig2Nonces(tx, params.walletId);
      case 'signerSignature': {
        const txId = tx.unsignedTxid();
        const cachedPsbt = PSBT_CACHE_WASM.get(txId);
        assert(
          cachedPsbt,
          `Psbt is missing from txCache (cache size ${PSBT_CACHE_WASM.size}).
            This may be due to the request being routed to a different BitGo-Express instance that for signing step 'signerNonce'.`
        );
        PSBT_CACHE_WASM.delete(txId);
        cachedPsbt.combineMusig2Nonces(tx);
        tx = cachedPsbt;
        break;
      }
      default:
        // this instance is not an external signer
        assert(params.walletId, 'walletId is required for MuSig2 bitgo nonce');
        assert(wasmSigner);
        tx.generateMusig2Nonces(wasmSigner);
        const response = await coin.getMusig2Nonces(tx, params.walletId);
        tx.combineMusig2Nonces(response);
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
  return signAndVerifyPsbtWasm(tx, signerKeychain, rootWalletKeys, params.replayProtection);
}
