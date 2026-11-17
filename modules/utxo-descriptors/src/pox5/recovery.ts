import { Psbt, Transaction } from '@bitgo/wasm-utxo';

import type { Pox5InputMatch } from './input';
import { assertPox5PrincipalPreimage } from './validation';

export const POX5_MAX_UNLOCK_HEIGHT = 500_000_000;

function assertPox5UnlockHeight(unlockHeight: number): void {
  if (!Number.isSafeInteger(unlockHeight) || unlockHeight <= 0 || unlockHeight >= POX5_MAX_UNLOCK_HEIGHT) {
    throw new Error(`PoX-5 unlock height must be a positive block height below ${POX5_MAX_UNLOCK_HEIGHT}`);
  }
}

function assertPox5BlockHeightLocktime(lockTime: number): void {
  if (!Number.isSafeInteger(lockTime) || lockTime < 0 || lockTime >= POX5_MAX_UNLOCK_HEIGHT) {
    throw new Error(`PoX-5 nLockTime must be a block height below ${POX5_MAX_UNLOCK_HEIGHT}`);
  }
}

function getMatchedTransactionInput(psbt: Psbt, match: Pox5InputMatch) {
  const psbtInput = psbt.getInputs()[match.inputIndex];
  const transactionInput = Transaction.fromBytes(psbt.getUnsignedTx()).getInputs()[match.inputIndex];
  const descriptorScript = Buffer.from(match.descriptor.scriptPubkey());
  if (
    !psbtInput?.witnessUtxo ||
    !transactionInput ||
    !Buffer.from(psbtInput.witnessUtxo.script).equals(descriptorScript)
  ) {
    throw new Error(`PoX-5 descriptor match does not match PSBT input ${match.inputIndex}`);
  }
  return transactionInput;
}

/** Validate the post-CLTV policy for all canonical PoX-5 inputs in a recovery PSBT. */
export function assertPox5LocktimeSpend(psbt: Psbt, inputs: readonly Pox5InputMatch[]): void {
  if (inputs.length === 0) {
    throw new Error('PoX-5 lockup descriptor match is required');
  }

  const unlockHeights = inputs.map((input) => {
    const { unlockHeight } = input.info;
    assertPox5UnlockHeight(unlockHeight);
    return unlockHeight;
  });
  const lockTime = psbt.lockTime();
  assertPox5BlockHeightLocktime(lockTime);
  const requiredLockTime = Math.max(...unlockHeights);
  if (lockTime < requiredLockTime) {
    throw new Error(`PoX-5 nLockTime must be at least ${requiredLockTime}`);
  }
  for (const input of inputs) {
    if (getMatchedTransactionInput(psbt, input).sequence === 0xffffffff) {
      throw new Error(`PoX-5 locktime spend input ${input.inputIndex} must use a non-final sequence`);
    }
  }
}

/**
 * Validate that a canonical PoX-5 input can use the principal-preimage branch.
 *
 * This only checks that the descriptor match belongs to the PSBT input. It does not check the nLockTime or the
 * principal preimage, so callers that sign or finalize an early exit must check those themselves
 * (see `assertPox5SpendPolicy` in `@bitgo/abstract-utxo`, which requires nLockTime 0 and the committed preimage).
 */
export function assertPox5EarlyExitSpend(psbt: Psbt, input: Pox5InputMatch): void {
  getMatchedTransactionInput(psbt, input);
}

export type Pox5SpendBranch = 'locktime' | 'early-exit';

/** Classify a PoX-5 spend from native principal-preimage metadata. */
export function classifyPox5Spend(psbt: Psbt, input: Pox5InputMatch): Pox5SpendBranch {
  getMatchedTransactionInput(psbt, input);
  const hasPrincipalPreimage = psbt
    .getInputKeyValues(input.inputIndex)
    .some((record) => record.type === 'known' && record.key === 'PSBT_IN_SHA256');
  return hasPrincipalPreimage ? 'early-exit' : 'locktime';
}

/** Add validated principal-preimage metadata for an early-exit spend. */
export function preparePox5EarlyExit(
  psbt: Psbt,
  inputIndex: number,
  input: Pox5InputMatch,
  principalPreimage: Uint8Array
): void {
  if (inputIndex !== input.inputIndex) {
    throw new Error(`PoX-5 descriptor match belongs to PSBT input ${input.inputIndex}, not ${inputIndex}`);
  }
  assertPox5EarlyExitSpend(psbt, input);
  assertPox5PrincipalPreimage(input.info, principalPreimage);
  psbt.addSha256Preimage(inputIndex, principalPreimage);
}
