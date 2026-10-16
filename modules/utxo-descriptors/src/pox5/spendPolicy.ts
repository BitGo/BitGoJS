import { descriptorWallet, Psbt } from '@bitgo/wasm-utxo';

import { Pox5InputMatch, matchPox5Input } from './input';
import { assertPox5LocktimeSpend, classifyPox5Spend } from './recovery';

function getPox5InputMatches(psbt: Psbt, descriptorMap: descriptorWallet.DescriptorMap): Pox5InputMatch[] {
  return Array.from({ length: psbt.inputCount() }, (_, i) => matchPox5Input(psbt, i, descriptorMap)).filter(
    (match): match is Pox5InputMatch => match !== undefined
  );
}

/**
 * Apply the PoX-5 staking spend policy to a PSBT before it is signed.
 *
 * PSBTs without PoX-5 lockup inputs are not affected. Otherwise, the PSBT must spend exactly one lockup
 * input through the post-CLTV (late exit) branch, with nLockTime at or above the unlock height and a non-final sequence.
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
  const branch = classifyPox5Spend(psbt, match);
  if (branch !== 'locktime') {
    throw new Error(`unsupported PoX-5 spend branch: ${branch}`);
  }
  assertPox5LocktimeSpend(psbt, matches);
}
