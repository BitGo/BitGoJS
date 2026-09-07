import * as assert from 'assert';
import { describe, it } from 'mocha';
import { CalendarEvent, ResolvedNetwork } from '../../pox5-bond-calendar/calendar';
import { renderIcs, renderMarkdown } from '../../pox5-bond-calendar/render';
import { NETWORK_NAMES, getNetwork } from '../../pox5-bond-calendar/networks';

const NET: ResolvedNetwork = {
  coin: 'tbtcstxsignet',
  burnChain: 'bitgo-private-signet',
  stacksOnly: false,
  activationBurnHeight: 1000,
  rewardCycleBlocks: 10,
  preparePhaseBlocks: 3,
  avgBlockSeconds: 600,
  anchor: { height: 2000, isoDate: '2026-01-01T00:00:00Z' },
  anchorSource: 'override',
  sources: ['SIP-045 section 3.1.2'],
};

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    uid: 'pox5-tbtcstxsignet-reward-cycle-2000@pox5-bond-calendar',
    network: 'tbtcstxsignet',
    kind: 'reward-cycle',
    height: 2000,
    date: new Date('2026-01-01T00:00:00Z'),
    summary: 'tbtcstxsignet — reward cycle 100',
    description: 'burn heights 2000-2009',
    ...overrides,
  };
}

describe('renderIcs', function () {
  it('produces a valid VCALENDAR wrapper with VEVENTs', function () {
    const ics = renderIcs(
      [event({}), event({ height: 2100, uid: 'second@x' })],
      'PoX-5 Bond Calendar',
      new Date('2026-02-01T00:00:00Z')
    );
    const lines = ics.split('\r\n');
    assert.strictEqual(lines[0], 'BEGIN:VCALENDAR');
    assert.strictEqual(lines[lines.length - 2], 'END:VCALENDAR');
    assert.strictEqual(lines.filter((line) => line === 'BEGIN:VEVENT').length, 2);
    assert.strictEqual(lines.filter((line) => line === 'END:VEVENT').length, 2);
    assert.ok(lines.some((line) => line.startsWith('UID:pox5-tbtcstxsignet-reward-cycle-2000@pox5-bond-calendar')));
    assert.ok(lines.some((line) => line === 'DTSTART:20260101T000000Z'));
  });

  it('escapes commas, semicolons and newlines in text fields', function () {
    const ics = renderIcs([event({ summary: 'a,b;c\nd' })], 'name', new Date('2026-02-01T00:00:00Z'));
    assert.ok(ics.split('\r\n').some((line) => line === 'SUMMARY:a\\,b\\;c\\nd'));
  });

  it('folds lines longer than 75 octets', function () {
    const longSummary = 'x'.repeat(200);
    const ics = renderIcs([event({ summary: longSummary })], 'name', new Date('2026-02-01T00:00:00Z'));
    for (const line of ics.split('\r\n')) {
      assert.ok(Buffer.from(line, 'utf8').length <= 75, `line too long: ${line}`);
    }
  });
});

describe('renderMarkdown', function () {
  it('renders network params, cycle tables and bond tables', function () {
    const md = renderMarkdown(
      [NET],
      { tbtcstxsignet: [event({})] },
      { tbtcstxsignet: { 'bond-1': [event({ kind: 'cltv-unlock', height: 2100, summary: 'unlock' })] } },
      6,
      new Date('2026-01-02T00:00:00Z')
    );
    assert.ok(md.includes('# PoX-5 bond calendar'));
    assert.ok(md.includes('## tbtcstxsignet (bitgo-private-signet, BTC-backed)'));
    assert.ok(md.includes('reward cycle: 10 burn blocks'));
    assert.ok(md.includes('| Event | Burn height | Estimated UTC date | Summary |'));
    assert.ok(md.includes('cltv-unlock'));
    assert.ok(md.includes('SIP-045 section 3.1.2'));
    assert.ok(md.includes('Safety margin for post-CLTV recovery: 6 burn blocks.'));
  });
});

describe('network table', function () {
  it('covers the PoX-5 coin set', function () {
    assert.deepStrictEqual(NETWORK_NAMES.sort(), [
      'btc',
      'tbtcbgsig',
      'tbtcstx',
      'tbtcstxsignet',
      'tstx',
      'tstxsignet',
    ]);
  });

  it('marks mainnet with verified activation and anchor', function () {
    const btc = getNetwork('btc');
    assert.strictEqual(btc.activationBurnHeight, 960_230);
    assert.strictEqual(btc.avgBlockSeconds, 600);
  });

  it('requires anchors for private signet networks', function () {
    for (const coin of ['tbtcstxsignet', 'tbtcbgsig', 'tstxsignet']) {
      assert.strictEqual(getNetwork(coin).anchor, null, `${coin} must not ship a guessed anchor`);
    }
  });

  it('marks STX-only networks', function () {
    assert.strictEqual(getNetwork('tstx').stacksOnly, true);
    assert.strictEqual(getNetwork('tstxsignet').stacksOnly, true);
    assert.strictEqual(getNetwork('btc').stacksOnly, false);
  });
});
