import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it } from 'mocha';
import { CalendarEvent, ResolvedNetwork } from '../../pox5-bond-calendar/calendar';
import { writePerNetworkOutputs } from '../../pox5-bond-calendar/render';

const NETS: ResolvedNetwork[] = [
  {
    coin: 'btc',
    burnChain: 'bitcoin-mainnet',
    stacksOnly: false,
    activationBurnHeight: 960_230,
    rewardCycleBlocks: 2100,
    preparePhaseBlocks: 100,
    avgBlockSeconds: 600,
    anchor: { height: 960_230, isoDate: '2026-07-30T08:32:18Z' },
    anchorSource: 'default',
    sources: ['SIP-045'],
  },
  {
    coin: 'tstxsignet',
    burnChain: 'stacks-foundation-private-signet',
    stacksOnly: true,
    activationBurnHeight: 0,
    rewardCycleBlocks: 10,
    preparePhaseBlocks: 3,
    avgBlockSeconds: 600,
    anchor: { height: 450, isoDate: '2026-10-13T10:00:00Z' },
    anchorSource: 'override',
    sources: ['stacks-core'],
  },
];

function event(net: string, height: number): CalendarEvent {
  return {
    uid: `pox5-${net}-reward-cycle-${height}@pox5-bond-calendar`,
    network: net,
    kind: 'reward-cycle',
    height,
    date: new Date('2026-10-14T00:00:00Z'),
    summary: `${net} reward cycle at ${height}`,
    description: 'test event',
  };
}

describe('writePerNetworkOutputs', function () {
  it('writes one ics and one md per network with only that network events', function () {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pox5-bond-calendar-'));
    try {
      const written = writePerNetworkOutputs(
        outDir,
        NETS,
        { btc: [event('btc', 972830)], tstxsignet: [event('tstxsignet', 540)] },
        { btc: { 'bond-1': [event('btc', 1_050_000)] } },
        6,
        new Date('2026-10-14T00:00:00Z')
      );
      assert.deepStrictEqual(written.map((file) => path.basename(file)).sort(), [
        'btc.ics',
        'btc.md',
        'tstxsignet.ics',
        'tstxsignet.md',
      ]);
      const btcIcs = fs.readFileSync(path.join(outDir, 'btc.ics'), 'utf8');
      assert.strictEqual(btcIcs.split('BEGIN:VEVENT').length - 1, 2);
      assert.ok(btcIcs.includes('X-WR-CALNAME:PoX-5 Bond Calendar — btc'));
      assert.ok(!btcIcs.includes('tstxsignet'));
      const tstxMd = fs.readFileSync(path.join(outDir, 'tstxsignet.md'), 'utf8');
      assert.ok(tstxMd.includes('## tstxsignet'));
      assert.ok(!tstxMd.includes('## btc'));
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
});
