import type { StacksApiClient, StacksBitcoinStakingAdapter, StacksNetworkClient } from './stacks-js';

export type BondContext = {
  staking: StacksBitcoinStakingAdapter;
  network: StacksNetworkClient;
  client: StacksApiClient;
};

export type BondCandidate = {
  bondIndex: number;
  allowanceSats: bigint;
  allowlisted: boolean;
  status?: string;
};

export type BondWindow = {
  rewardCycleId: number;
  firstRewardCycle: number;
  bondGapCycles: number;
  currentBondIndex: number;
  candidates: BondCandidate[];
};

/**
 * Scans existing bonds within `radius` of the bond index derived from the current
 * reward cycle. Status is read only for bonds the staker is allowlisted for.
 */
export async function scanBondWindow(
  ctx: BondContext,
  args: { stakerAddress: string; amountSats: bigint; radius: number }
): Promise<BondWindow> {
  const poxInfo = await ctx.staking.fetchPoxInfo({ network: ctx.network, client: ctx.client });
  const rewardCycleId = Number((poxInfo as { rewardCycleId: number }).rewardCycleId);
  const firstRewardCycle = ctx.staking.firstPox5RewardCycle(poxInfo) ?? 0;
  const bondGapCycles = ctx.staking.bondGapCycles;
  const currentBondIndex = Math.floor((rewardCycleId - firstRewardCycle) / bondGapCycles);
  const candidates: BondCandidate[] = [];
  for (
    let bondIndex = Math.max(0, currentBondIndex - args.radius);
    bondIndex <= currentBondIndex + args.radius;
    bondIndex += 1
  ) {
    const bond = await ctx.staking.fetchBond({ bondIndex, network: ctx.network, client: ctx.client });
    if (bond === undefined) continue;
    const allowance =
      (await ctx.staking.fetchBondAllowance({
        bondIndex,
        address: args.stakerAddress,
        network: ctx.network,
        client: ctx.client,
      })) ?? 0n;
    const allowlisted = allowance >= args.amountSats;
    const status = allowlisted
      ? await ctx.staking.fetchBondStatus({ bondIndex, network: ctx.network, client: ctx.client })
      : undefined;
    candidates.push({ bondIndex, allowanceSats: allowance, allowlisted, ...(status === undefined ? {} : { status }) });
  }
  return { rewardCycleId, firstRewardCycle, bondGapCycles, currentBondIndex, candidates };
}

/** Bond indexes that are open and allowlisted for the staker, in scan order. */
export function openAllowlistedBonds(window: BondWindow): number[] {
  return window.candidates
    .filter((candidate) => candidate.allowlisted && candidate.status === 'open')
    .map((candidate) => candidate.bondIndex);
}
