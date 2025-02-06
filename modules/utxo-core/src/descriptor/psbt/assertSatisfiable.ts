/**
 * These are some helpers for testing satisfiability of descriptors in PSBTs.
 *
 * They are mostly a debugging aid - if an input cannot be satisified, the `finalizePsbt()` method will fail, but
 * the error message is pretty vague.
 *
 * The methods here have the goal of catching certain cases earlier and with a better error message.
 *
 * The goal is not an exhaustive check, but to catch common mistakes.
 */
import { Descriptor } from '@bitgo/wasm-miniscript';
import * as utxolib from '@bitgo/utxo-lib';

export const FINAL_SEQUENCE = 0xffffffff;

/**
 * Get the required locktime for a descriptor.
 * @param descriptor
 */
export function getRequiredLocktime(descriptor: Descriptor | unknown): number | undefined {
  if (descriptor instanceof Descriptor) {
    return getRequiredLocktime(descriptor.node());
  }
  if (typeof descriptor !== 'object' || descriptor === null) {
    return undefined;
  }
  if ('Wsh' in descriptor) {
    return getRequiredLocktime(descriptor.Wsh);
  }
  if ('Sh' in descriptor) {
    return getRequiredLocktime(descriptor.Sh);
  }
  if ('Ms' in descriptor) {
    return getRequiredLocktime(descriptor.Ms);
  }
  if ('AndV' in descriptor) {
    if (!Array.isArray(descriptor.AndV)) {
      throw new Error('Expected an array');
    }
    if (descriptor.AndV.length !== 2) {
      throw new Error('Expected exactly two elements');
    }
    const [a, b] = descriptor.AndV;
    return getRequiredLocktime(a) ?? getRequiredLocktime(b);
  }
  if ('Drop' in descriptor) {
    return getRequiredLocktime(descriptor.Drop);
  }
  if ('Verify' in descriptor) {
    return getRequiredLocktime(descriptor.Verify);
  }
  if ('After' in descriptor && typeof descriptor.After === 'object' && descriptor.After !== null) {
    if ('absLockTime' in descriptor.After && typeof descriptor.After.absLockTime === 'number') {
      return descriptor.After.absLockTime;
    }
  }
  return undefined;
}

export function assertSatisfiable(psbt: utxolib.Psbt, inputIndex: number, descriptor: Descriptor): void {
  // If the descriptor requires a locktime, the input must have a non-final sequence number
  const requiredLocktime = getRequiredLocktime(descriptor);
  if (requiredLocktime !== undefined) {
    const input = psbt.txInputs[inputIndex];
    if (input.sequence === FINAL_SEQUENCE) {
      throw new Error(`Input ${inputIndex} has a non-final sequence number, but requires a timelock`);
    }
    if (psbt.locktime !== requiredLocktime) {
      throw new Error(`psbt locktime (${psbt.locktime}) does not match required locktime (${requiredLocktime})`);
    }
  }
}
