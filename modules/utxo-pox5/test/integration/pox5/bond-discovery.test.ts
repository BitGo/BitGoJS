import assert from 'node:assert/strict';

import { type BondContext, openAllowlistedBonds, scanBondWindow } from './bond-discovery';

type FakeBonds = Record<number, { allowance: bigint; status: string }>;

function fakeContext(args: { currentCycle: number; firstCycle: number; gap: number; bonds: FakeBonds }): BondContext {
  const staking = {
    fetchPoxInfo: async () => ({ rewardCycleId: args.currentCycle }),
    firstPox5RewardCycle: () => args.firstCycle,
    bondGapCycles: args.gap,
    fetchBond: async ({ bondIndex }: { bondIndex: number }) => (bondIndex in args.bonds ? { ok: true } : undefined),
    fetchBondAllowance: async ({ bondIndex }: { bondIndex: number }) => args.bonds[bondIndex]?.allowance,
    fetchBondStatus: async ({ bondIndex }: { bondIndex: number }) => args.bonds[bondIndex]?.status ?? 'missing',
  };
  return {
    staking,
    network: {} as BondContext['network'],
    client: {} as BondContext['client'],
  } as unknown as BondContext;
}

describe('PoX-5 bond discovery (offline)', function () {
  // currentBondIndex = floor((cycle - first) / gap) = floor((690 - 14) / 2) = 338
  const base = { currentCycle: 690, firstCycle: 14, gap: 2 };

  it('derives the current bond index from the reward cycle', async function () {
    const window = await scanBondWindow(fakeContext({ ...base, bonds: {} }), {
      stakerAddress: 'ST1',
      amountSats: 30_000n,
      radius: 1,
    });
    assert.equal(window.currentBondIndex, 338);
    assert.deepEqual(window.candidates, []);
  });

  it('selects only open bonds the staker is allowlisted for', async function () {
    const bonds: FakeBonds = {
      337: { allowance: 30_000n, status: 'locked' },
      338: { allowance: 30_000n, status: 'open' },
      336: { allowance: 10_000n, status: 'open' },
    };
    const window = await scanBondWindow(fakeContext({ ...base, bonds }), {
      stakerAddress: 'ST1',
      amountSats: 30_000n,
      radius: 2,
    });
    assert.deepEqual(openAllowlistedBonds(window), [338]);
  });

  it('reports multiple open allowlisted bonds so the caller can refuse to guess', async function () {
    const bonds: FakeBonds = {
      337: { allowance: 30_000n, status: 'open' },
      338: { allowance: 30_000n, status: 'open' },
    };
    const window = await scanBondWindow(fakeContext({ ...base, bonds }), {
      stakerAddress: 'ST1',
      amountSats: 30_000n,
      radius: 1,
    });
    assert.deepEqual(openAllowlistedBonds(window), [337, 338]);
  });

  it('treats a missing allowance as not allowlisted and does not read status', async function () {
    const bonds: FakeBonds = { 338: { allowance: 0n, status: 'open' } };
    const window = await scanBondWindow(fakeContext({ ...base, bonds }), {
      stakerAddress: 'ST1',
      amountSats: 30_000n,
      radius: 0,
    });
    assert.deepEqual(window.candidates, [{ bondIndex: 338, allowanceSats: 0n, allowlisted: false }]);
    assert.deepEqual(openAllowlistedBonds(window), []);
  });
});
