import assert from 'assert';

import { isTriple } from '@bitgo/sdk-core';
import { BIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { SignTransactionOptions } from '../../abstractUtxoCoin';
import { getReplayProtectionPubkeys } from '../../transaction/fixedScript/replayProtection';
import { BulkSigningError } from '../../transaction/fixedScript/SigningError';
import { finalizeSignedPsbt } from '../../transaction/fixedScript/signTransaction';
import {
  ReplayProtectionKeys,
  verifyPsbtSignaturesWasm,
  writeWasmUtxoSignedWithKv,
} from '../../transaction/fixedScript/signPsbtWasm';
import { getSignerKeychain, toSignTransactionResult } from '../../transaction/signTransaction';

import type { Zec } from './zec';

/**
 * Sign all transparent inputs of a v6 (Ironwood) Zcash PSBT and verify the signatures.
 *
 * v6 PSBTs override `sign(key)` to require the wallet root keys: on the first signing round —
 * which the wasm enforces to be the user's root key — they derive the wallet ovk (the ECDH
 * agreement of `rootWalletKeys.bitgoKey()` and the user root key) and finalize the shielded
 * output's out_ciphertext before computing any transparent sighash. Later rounds no-op that
 * step, so rootWalletKeys is passed unconditionally. Transparent inputs are signed with
 * ordinary ECDSA over the ZIP-244 sighash either way.
 *
 * The generic `signAndVerifyPsbtWasm` cannot provide this: its `tx.sign(wasmSigner)` call does
 * not satisfy the v6 override's rootWalletKeys requirement. Verification and signed-with
 * metadata are shared with the generic path.
 */
export function signAndVerifyIronwoodPsbt(
  tx: fixedScriptWallet.ZcashIronwoodBitGoPsbt,
  signerKeychain: BIP32,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys,
  replayProtection: ReplayProtectionKeys,
  { writeSignedWith = false }: { writeSignedWith?: boolean } = {}
): fixedScriptWallet.ZcashIronwoodBitGoPsbt {
  try {
    tx.sign(signerKeychain, rootWalletKeys);
  } catch (e) {
    throw new BulkSigningError(e);
  }

  verifyPsbtSignaturesWasm(tx, signerKeychain, rootWalletKeys, replayProtection);

  if (writeSignedWith) {
    writeWasmUtxoSignedWithKv(tx);
  }

  return tx;
}

/**
 * Sign a v6 (Ironwood) Zcash prebuild. Called from `Zec.signTransaction` once the decoded
 * prebuild is known to be an Ironwood PSBT; every other prebuild keeps the generic path.
 */
export function signIronwoodTransaction<TNumber extends number | bigint = number>(
  coin: Zec,
  tx: fixedScriptWallet.ZcashIronwoodBitGoPsbt,
  params: SignTransactionOptions<TNumber>
): { txHex: string } {
  const signerKeychain = getSignerKeychain('prv' in params ? params.prv : undefined);
  assert(signerKeychain, 'missing signer keychain');

  assert(params.pubs, 'pubs are required for fixed script signing');
  assert(isTriple(params.pubs), 'pubs must be a triple');
  const rootWalletKeys = fixedScriptWallet.RootWalletKeys.fromXpubs(params.pubs);

  const signedPsbt = signAndVerifyIronwoodPsbt(
    tx,
    signerKeychain,
    rootWalletKeys,
    { publicKeys: getReplayProtectionPubkeys(coin.wasmName) },
    { writeSignedWith: params.writeSignedWith }
  );

  const signedTx = finalizeSignedPsbt(signedPsbt, params);
  return toSignTransactionResult(signedTx, params);
}
