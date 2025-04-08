import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { Psbt as WasmPsbt } from '@bitgo/wasm-miniscript';

/** These can be replaced when @bitgo/wasm-miniscript is updated */
export type SignPsbtInputResult = { Schnorr: string[] } | { Ecdsa: string[] };
export type SignPsbtResult = {
  [inputIndex: number]: SignPsbtInputResult;
};

/**
 * @param signResult
 * @return the number of new signatures created by the signResult for a single input
 */
export function getNewSignatureCountForInput(signResult: SignPsbtInputResult): number {
  if ('Schnorr' in signResult) {
    return signResult.Schnorr.length;
  }
  if ('Ecdsa' in signResult) {
    return signResult.Ecdsa.length;
  }
  throw new Error(`Unknown signature type ${Object.keys(signResult).join(', ')}`);
}

/**
 * @param signResult
 * @return the number of new signatures created by the signResult
 */
export function getNewSignatureCount(signResult: SignPsbtResult): number {
  return Object.values(signResult).reduce((sum, signatures) => sum + getNewSignatureCountForInput(signatures), 0);
}

type Key = Buffer | utxolib.BIP32Interface | utxolib.ECPairInterface;

/** Convenience function to sign a PSBT with a key */
export function signWithKey(psbt: WasmPsbt, key: Key): SignPsbtResult {
  // we need to do casting here because the type definitions in wasm-miniscript are a little bit buggy
  if (Buffer.isBuffer(key)) {
    return psbt.signWithPrv(key) as unknown as SignPsbtResult;
  }
  if ('toBase58' in key) {
    return psbt.signWithXprv(key.toBase58()) as unknown as SignPsbtResult;
  }
  assert(key.privateKey);
  return psbt.signWithPrv(key.privateKey) as unknown as SignPsbtResult;
}
