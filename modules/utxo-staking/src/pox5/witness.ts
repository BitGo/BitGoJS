import { Psbt } from '@bitgo/wasm-utxo';
import { pox5 } from '@bitgo/utxo-descriptors';

import { assertPox5LocktimeSpend, preparePox5EarlyExit } from './recovery';

export type Pox5FinalizerParams = {
  /** The canonical descriptor match for the input being finalized. */
  match: pox5.Pox5InputMatch;
};

function assertFinalizerInputIndex(inputIndex: number, match: pox5.Pox5InputMatch): void {
  if (inputIndex !== match.inputIndex) {
    throw new Error(`PoX-5 descriptor match belongs to PSBT input ${match.inputIndex}, not ${inputIndex}`);
  }
}

/** Finalize the post-CLTV 2-of-3 PoX-5 spend branch. */
export function finalizePox5LocktimePath(psbt: Psbt, inputIndex: number, params: Pox5FinalizerParams): void {
  assertFinalizerInputIndex(inputIndex, params.match);
  assertPox5LocktimeSpend(psbt, [params.match]);
  psbt.updateInputWithDescriptor(inputIndex, params.match.descriptor);
  psbt.finalizeInput(inputIndex);
}

/** Finalize the principal-preimage early-exit 2-of-3 PoX-5 spend branch. */
export function finalizePox5EarlyExitPath(
  psbt: Psbt,
  inputIndex: number,
  params: Pox5FinalizerParams & { principalPreimage: Uint8Array }
): void {
  assertFinalizerInputIndex(inputIndex, params.match);
  preparePox5EarlyExit(psbt, inputIndex, params.match, params.principalPreimage);
  psbt.updateInputWithDescriptor(inputIndex, params.match.descriptor);
  psbt.finalizeInput(inputIndex);
}
