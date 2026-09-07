import * as assert from 'assert';
import { describe, it } from 'mocha';
import {
  BondInput,
  ResolvedNetwork,
  buildBondEvents,
  buildUpcomingCycleEvents,
  currentHeightAt,
  cycleEnd,
  cycleIndexAt,
  cycleStart,
  heightToDate,
  nextCycleStart,
} from '../../pox5-bond-calendar/calendar';

const NET: ResolvedNetwork = {
  coin: 'testnet',
  burnChain: 'test-burn-chain',
  stacksOnly: false,
  activationBurnHeight: 1000,
  rewardCycleBlocks: 100,
  preparePhaseBlocks: 10,
  avgBlockSeconds: 600,
  anchor: { height: 2000, isoDate: '2026-01-01T00:00:00Z' },
  anchorSource: 'default',
  sources: [],
};

const STX_ONLY_NET: ResolvedNetwork = { ...NET, coin: 'stx-only', stacksOnly: true };

function date(iso: string): Date {
  return new Date(iso);
}

describe('heightToDate', function () {
  it('returns the anchor date at the anchor height', function () {
    assert.strictEqual(heightToDate(NET, 2000).getTime(), date('2026-01-01T00:00:00Z').getTime());
  });

  it('extrapolates forward and backward by the average block interval', function () {
    assert.strictEqual(heightToDate(NET, 2010).getTime(), date('2026-01-01T01:40:00Z').getTime());
    assert.strictEqual(heightToDate(NET, 1990).getTime(), date('2025-12-31T22:20:00Z').getTime());
  });

  it('rejects an invalid anchor date', function () {
    const bad: ResolvedNetwork = { ...NET, anchor: { height: 2000, isoDate: 'not-a-date' } };
    assert.throws(() => heightToDate(bad, 2000), /invalid anchor date/);
  });
});

describe('currentHeightAt', function () {
  it('maps wall-clock time back to an estimated burn height', function () {
    assert.strictEqual(currentHeightAt(NET, date('2026-01-01T01:40:00Z')), 2010);
    assert.strictEqual(currentHeightAt(NET, date('2025-12-31T23:50:00Z')), 1999);
  });
});

describe('reward cycle math', function () {
  it('indexes cycles from the activation height', function () {
    assert.strictEqual(cycleIndexAt(NET, 1000), 0);
    assert.strictEqual(cycleIndexAt(NET, 1099), 0);
    assert.strictEqual(cycleIndexAt(NET, 1100), 1);
    assert.strictEqual(cycleStart(NET, 3), 1300);
    assert.strictEqual(cycleEnd(NET, 3), 1400);
  });

  it('rejects heights before activation', function () {
    assert.throws(() => cycleIndexAt(NET, 999), /precedes pox-5 activation/);
  });

  it('computes the next cycle start', function () {
    assert.strictEqual(nextCycleStart(NET, 1050), 1100);
    assert.strictEqual(nextCycleStart(NET, 999), 1000);
  });
});

describe('bondCycleIndices via buildBondEvents', function () {
  const bond: BondInput = { network: 'testnet', label: 'b1', unlockBurnHeight: 1330, lockHeight: 1150 };

  it('emits funding, registration, per-cycle, CLTV and recovery events', function () {
    const events = buildBondEvents(NET, bond, 6);
    assert.deepStrictEqual(
      events.map((event) => [event.kind, event.height]),
      [
        ['lockup-funding', 1150],
        ['registration-window', 1200],
        ['reward-cycle', 1200],
        ['reward-cycle', 1300],
        ['cltv-unlock', 1330],
        ['post-cltv-recovery', 1336],
      ]
    );
  });

  it('honors startBurnHt and numCycles', function () {
    const events = buildBondEvents(NET, { ...bond, startBurnHt: 1250, numCycles: 2 }, 6);
    assert.deepStrictEqual(
      events.filter((event) => event.kind === 'reward-cycle').map((event) => event.height),
      [1200, 1300]
    );
  });

  it('caps cycle events at 24 when numCycles is not given', function () {
    const events = buildBondEvents(NET, { network: 'testnet', unlockBurnHeight: 999_999 }, 6);
    const cycles = events.filter((event) => event.kind === 'reward-cycle');
    assert.strictEqual(cycles.length, 24);
  });

  it('respects the safety margin', function () {
    const events = buildBondEvents(NET, bond, 20);
    const recovery = events.find((event) => event.kind === 'post-cltv-recovery');
    assert.ok(recovery);
    assert.strictEqual(recovery.height, 1350);
  });

  it('requires unlockBurnHeight for BTC-backed bonds', function () {
    assert.throws(() => buildBondEvents(NET, { network: 'testnet' }, 6), /unlockBurnHeight is required/);
  });

  it('rejects unlock heights before activation', function () {
    assert.throws(
      () => buildBondEvents(NET, { network: 'testnet', unlockBurnHeight: 900 }, 6),
      /precedes pox-5 activation/
    );
  });
});

describe('STX-only bonds', function () {
  it('schedules stake start, cycles and lock end', function () {
    const events = buildBondEvents(
      STX_ONLY_NET,
      { network: 'stx-only', label: 's1', startBurnHt: 1200, numCycles: 2 },
      6
    );
    assert.deepStrictEqual(
      events.map((event) => [event.kind, event.height]),
      [
        ['registration-window', 1200],
        ['reward-cycle', 1200],
        ['reward-cycle', 1300],
        ['stx-lock-end', 1400],
      ]
    );
  });

  it('requires startBurnHt and numCycles', function () {
    assert.throws(
      () => buildBondEvents(STX_ONLY_NET, { network: 'stx-only', numCycles: 1 }, 6),
      /startBurnHt and numCycles are required/
    );
  });
});

describe('buildUpcomingCycleEvents', function () {
  it('lists cycles after the current height', function () {
    const events = buildUpcomingCycleEvents(NET, 3, 1210);
    assert.deepStrictEqual(
      events.map((event) => event.height),
      [1300, 1400, 1500]
    );
  });

  it('starts at activation when the current height precedes it', function () {
    const events = buildUpcomingCycleEvents(NET, 2, 500);
    assert.deepStrictEqual(
      events.map((event) => event.height),
      [1000, 1100]
    );
  });
});
