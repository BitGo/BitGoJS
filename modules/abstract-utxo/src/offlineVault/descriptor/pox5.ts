import { pox5 } from '@bitgo/utxo-descriptors';
import { descriptorWallet, Psbt } from '@bitgo/wasm-utxo';

function getPox5InputMatches(psbt: Psbt, descriptorMap: descriptorWallet.DescriptorMap): pox5.Pox5InputMatch[] {
  return Array.from({ length: psbt.inputCount() }, (_, i) => pox5.matchPox5Input(psbt, i, descriptorMap)).filter(
    (match): match is pox5.Pox5InputMatch => match !== undefined
  );
}

/** WP builds early exits with a zero nLockTime; the early-exit branch does not evaluate the CLTV. */
const POX5_EARLY_EXIT_LOCKTIME = 0;

function assertPox5EarlyExitPolicy(psbt: Psbt, match: pox5.Pox5InputMatch): void {
  pox5.assertPox5EarlyExitSpend(psbt, match);
  const lockTime = psbt.lockTime();
  if (lockTime !== POX5_EARLY_EXIT_LOCKTIME) {
    throw new Error(`PoX-5 early exit nLockTime must be ${POX5_EARLY_EXIT_LOCKTIME}, got ${lockTime}`);
  }
  // throws unless exactly one PSBT_IN_SHA256 record carries the descriptor's commitment and its preimage
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
  const branch = pox5.classifyPox5Spend(psbt, match);
  switch (branch) {
    case 'locktime':
      pox5.assertPox5LocktimeSpend(psbt, matches);
      return;
    case 'early-exit':
      assertPox5EarlyExitPolicy(psbt, match);
      return;
    default:
      throw new Error(`unsupported PoX-5 spend branch: ${branch}`);
  }
}
