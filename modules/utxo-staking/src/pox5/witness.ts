import { createHash } from 'crypto';

import { ast, Descriptor, Psbt } from '@bitgo/wasm-utxo';
import { pox5 } from '@bitgo/utxo-descriptors';

type Pox5Descriptor = Descriptor | ast.DescriptorNode;

export type Pox5FinalizerParams = {
  /** A definite or derivation-indexed canonical PoX-5 descriptor. */
  descriptor: Pox5Descriptor;
  /** The derived user, backup, and BitGo keys in descriptor order. */
  stakerKeys: [Buffer, Buffer, Buffer];
};

function getParsedDescriptor(params: Pox5FinalizerParams) {
  const parsed = pox5.parsePox5LockupDescriptor(params.descriptor);
  if (!parsed || !parsed.stakerKeys) {
    throw new Error('descriptor must be a definite or derivation-indexed canonical PoX-5 descriptor');
  }
  if (!parsed.stakerKeys.every((key, index) => key.equals(params.stakerKeys[index]))) {
    throw new Error('stakerKeys must match the canonical descriptor order');
  }
  return parsed;
}

function getDescriptor(descriptor: Pox5Descriptor): Descriptor {
  return descriptor instanceof Descriptor ? descriptor : Descriptor.fromString(ast.formatNode(descriptor), 'definite');
}

function prepareInput(psbt: Psbt, inputIndex: number, params: Pox5FinalizerParams) {
  const parsed = getParsedDescriptor(params);
  psbt.updateInputWithDescriptor(inputIndex, getDescriptor(params.descriptor));
  return parsed;
}

/** Finalize the post-CLTV 2-of-3 PoX-5 spend branch. */
export function finalizePox5LocktimePath(psbt: Psbt, inputIndex: number, params: Pox5FinalizerParams): void {
  const parsed = prepareInput(psbt, inputIndex, params);
  if (psbt.lockTime() < parsed.unlockHeight) {
    throw new Error(`transaction locktime must be at least ${parsed.unlockHeight}`);
  }
  psbt.finalizeInput(inputIndex);
}

/** Finalize the principal-preimage early-exit 2-of-3 PoX-5 spend branch. */
export function finalizePox5EarlyExitPath(
  psbt: Psbt,
  inputIndex: number,
  params: Pox5FinalizerParams & { principalPreimage: Buffer }
): void {
  const parsed = prepareInput(psbt, inputIndex, params);
  const preimageHash = createHash('sha256').update(params.principalPreimage).digest();
  if (!preimageHash.equals(parsed.stakerCommitment)) {
    throw new Error('principalPreimage does not match the descriptor stakerCommitment');
  }
  psbt.addSha256Preimage(inputIndex, params.principalPreimage);
  psbt.finalizeInput(inputIndex);
}
