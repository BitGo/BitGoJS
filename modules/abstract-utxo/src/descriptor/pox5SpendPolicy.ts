import { pox5 } from '@bitgo/utxo-descriptors';
import { descriptorWallet, Psbt } from '@bitgo/wasm-utxo';

function getPox5InputMatches(psbt: Psbt, descriptorMap: descriptorWallet.DescriptorMap): pox5.Pox5InputMatch[] {
  return Array.from({ length: psbt.inputCount() }, (_, i) => pox5.matchPox5Input(psbt, i, descriptorMap)).filter(
    (match): match is pox5.Pox5InputMatch => match !== undefined
  );
}

/** WP builds early exits with a zero nLockTime; the early-exit branch does not evaluate the CLTV. */
const POX5_EARLY_EXIT_LOCKTIME = 0;

/**
 * The early-exit checks beyond what the shared `pox5.assertPox5EarlyExitSpend` does (it only checks that the
 * input matches the descriptor): nLockTime 0 and exactly one principal preimage that the descriptor commits to.
 * `classifyPox5Spend` has already checked the descriptor match by the time this runs.
 */
function assertPox5EarlyExitPolicy(psbt: Psbt, match: pox5.Pox5InputMatch): void {
  const lockTime = psbt.lockTime();
  if (lockTime !== POX5_EARLY_EXIT_LOCKTIME) {
    throw new Error(`PoX-5 early exit nLockTime must be ${POX5_EARLY_EXIT_LOCKTIME}, got ${lockTime}`);
  }
  const sha256Records = psbt
    .getInputKeyValues(match.inputIndex)
    .filter((record) => record.type === 'known' && record.key === 'PSBT_IN_SHA256');
  if (sha256Records.length !== 1) {
    throw new Error(`PoX-5 early exit requires exactly one PSBT_IN_SHA256 record, found ${sha256Records.length}`);
  }
  // throws unless the record carries the descriptor's commitment and its preimage
  pox5.getPox5PrincipalPreimage(psbt, match.inputIndex, match.info);
}

/**
 * Apply the PoX-5 staking spend policy to a PSBT before it is signed.
 *
 * PSBTs without PoX-5 lockup inputs are not affected. Otherwise, the PSBT must spend exactly one lockup
 * input through one of two branches:
 * - post-CLTV (late exit): nLockTime at or above the unlock height and a non-final sequence.
 * - principal-preimage (early exit): nLockTime 0 and the principal preimage committed by the descriptor.
 */
export function assertPox5SpendPolicy(psbt: Psbt, descriptorMap: descriptorWallet.DescriptorMap): void {
  const matches = getPox5InputMatches(psbt, descriptorMap);
  if (matches.length === 0) {
    return;
  }
  if (matches.length !== 1) {
    throw new Error(`expected exactly one PoX-5 lockup input, found ${matches.length}`);
  }
  const [match] = matches;
  // Any PSBT_IN_SHA256 record makes this an early exit, even one the descriptor does not commit to: a stray
  // record is then refused by the early-exit checks instead of being carried along in a late exit.
  const branch = pox5.classifyPox5Spend(psbt, match);
  switch (branch) {
    case 'locktime':
      pox5.assertPox5LocktimeSpend(psbt, matches);
      return;
    case 'early-exit':
      assertPox5EarlyExitPolicy(psbt, match);
      return;
    default: {
      const unsupported: never = branch;
      throw new Error(`unsupported PoX-5 spend branch: ${String(unsupported)}`);
    }
  }
}
