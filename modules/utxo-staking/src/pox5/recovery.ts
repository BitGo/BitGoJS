import { Psbt, Transaction } from '@bitgo/wasm-utxo';
import { pox5 } from '@bitgo/utxo-descriptors';

export const POX5_MAX_UNLOCK_HEIGHT = 500_000_000;

export type Pox5SpendBranch = 'locktime' | 'early-exit';

export type Pox5SpendInput = pox5.Pox5InputMatch | pox5.Pox5DescriptorInfo;

function getPox5DescriptorInfo(input: Pox5SpendInput): pox5.Pox5DescriptorInfo {
  return 'info' in input ? input.info : input;
}

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

function hasFinalInput(psbt: Psbt): boolean {
  return Transaction.fromBytes(psbt.getUnsignedTx())
    .getInputs()
    .some((input) => input.sequence === 0xffffffff);
}

/** Classify a canonical PoX-5 input by the transaction branch it can spend. */
export function classifyPox5Spend(psbt: Psbt, input: pox5.Pox5InputMatch): Pox5SpendBranch {
  const { unlockHeight } = input.info;
  assertPox5UnlockHeight(unlockHeight);
  const lockTime = psbt.lockTime();
  assertPox5BlockHeightLocktime(lockTime);
  return lockTime >= unlockHeight ? 'locktime' : 'early-exit';
}

/** Validate the post-CLTV policy for all canonical PoX-5 inputs in a recovery PSBT. */
export function assertPox5LocktimeSpend(psbt: Psbt, inputs: readonly Pox5SpendInput[]): void {
  if (inputs.length === 0) {
    throw new Error('PoX-5 lockup descriptor match is required');
  }

  const unlockHeights = inputs.map((input) => {
    const { unlockHeight } = getPox5DescriptorInfo(input);
    assertPox5UnlockHeight(unlockHeight);
    return unlockHeight;
  });
  const lockTime = psbt.lockTime();
  assertPox5BlockHeightLocktime(lockTime);
  const requiredLockTime = Math.max(...unlockHeights);
  if (lockTime < requiredLockTime) {
    throw new Error(`PoX-5 nLockTime must be at least ${requiredLockTime}`);
  }
  if (hasFinalInput(psbt)) {
    throw new Error('PoX-5 locktime spend inputs must use non-final sequences');
  }
}

/** Validate that a canonical PoX-5 input uses the principal-preimage branch. */
export function assertPox5EarlyExitSpend(psbt: Psbt, input: pox5.Pox5InputMatch): void {
  if (classifyPox5Spend(psbt, input) !== 'early-exit') {
    throw new Error('PoX-5 input is not an early-exit spend');
  }
}

/** Add validated principal-preimage metadata for an early-exit spend. */
export function preparePox5EarlyExit(
  psbt: Psbt,
  inputIndex: number,
  input: pox5.Pox5InputMatch,
  principalPreimage: Uint8Array
): void {
  assertPox5EarlyExitSpend(psbt, input);
  pox5.assertPox5PrincipalPreimage(input.info, principalPreimage);
  psbt.addSha256Preimage(inputIndex, principalPreimage);
}
