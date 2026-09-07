import * as assert from 'assert';
import { describe, it } from 'mocha';
import { parseBondsJson, validateSingleBond } from '../../pox5-bond-calendar/bonds';

describe('parseBondsJson', function () {
  it('parses an array of bonds across networks', function () {
    const bonds = parseBondsJson(
      JSON.stringify([
        { network: 'tbtcstxsignet', label: 'smoke-1', amount: '1000000', unlockBurnHeight: 41000 },
        { network: 'tstx', startBurnHt: 27300, numCycles: 3 },
        { network: 'btc', unlockBurnHeight: 1_050_000, lockHeight: 965_000 },
      ])
    );
    assert.strictEqual(bonds.length, 3);
    assert.strictEqual(bonds[0].label, 'smoke-1');
    assert.strictEqual(bonds[0].amount, 1_000_000n);
    assert.strictEqual(bonds[1].numCycles, 3);
    assert.strictEqual(bonds[2].lockHeight, 965_000);
  });

  it('rejects invalid JSON and non-arrays', function () {
    assert.throws(() => parseBondsJson('{'), /not valid JSON/);
    assert.throws(() => parseBondsJson('{"network":"btc"}'), /JSON array/);
  });

  it('requires unlockBurnHeight for BTC-backed networks', function () {
    assert.throws(() => parseBondsJson(JSON.stringify([{ network: 'tbtcbgsig' }])), /unlockBurnHeight is required/);
  });

  it('rejects unlockBurnHeight on STX-only networks', function () {
    assert.throws(
      () =>
        parseBondsJson(
          JSON.stringify([{ network: 'tstxsignet', unlockBurnHeight: 100, startBurnHt: 100, numCycles: 1 }])
        ),
      /STX-only/
    );
  });

  it('rejects unlock heights at or above 500000000', function () {
    assert.throws(
      () => parseBondsJson(JSON.stringify([{ network: 'btc', unlockBurnHeight: 500_000_000 }])),
      /below 500000000/
    );
  });

  it('rejects unknown networks', function () {
    assert.throws(
      () => parseBondsJson(JSON.stringify([{ network: 'tbtc', unlockBurnHeight: 100 }])),
      /unknown network/
    );
  });

  it('rejects non-integer and non-positive fields', function () {
    assert.throws(
      () => parseBondsJson(JSON.stringify([{ network: 'btc', unlockBurnHeight: 1.5 }])),
      /positive integer/
    );
    assert.throws(() => parseBondsJson(JSON.stringify([{ network: 'btc', unlockBurnHeight: -5 }])), /positive integer/);
    assert.throws(
      () => parseBondsJson(JSON.stringify([{ network: 'btc', unlockBurnHeight: 100, numCycles: 0 }])),
      /positive integer/
    );
  });

  it('rejects malformed amounts', function () {
    assert.throws(
      () => parseBondsJson(JSON.stringify([{ network: 'btc', unlockBurnHeight: 100, amount: '1e6' }])),
      /amount/
    );
  });
});

describe('validateSingleBond', function () {
  it('applies the same validation to CLI bonds', function () {
    const bond = validateSingleBond('tbtcstxsignet', { label: 'cli', unlockBurnHeight: 41_000 });
    assert.strictEqual(bond.network, 'tbtcstxsignet');
    assert.strictEqual(bond.unlockBurnHeight, 41_000);
    assert.throws(() => validateSingleBond('tbtcbgsig', {}), /unlockBurnHeight is required/);
  });
});
