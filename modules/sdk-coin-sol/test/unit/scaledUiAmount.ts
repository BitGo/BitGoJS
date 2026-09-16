import 'should';
import { rawToUiAmountString, uiAmountToRaw } from '../../src/lib/scaledUiAmount';

describe('Sol ScaledUiAmount conversions', function () {
  describe('rawToUiAmountString', function () {
    it('converts raw to UI with multiplier 1 (identity denomination)', function () {
      rawToUiAmountString(1_000_000_000n, '1', 9).should.equal('1');
      rawToUiAmountString(1n, '1', 9).should.equal('0.000000001');
      rawToUiAmountString(0n, '1', 9).should.equal('0');
    });

    it('converts raw to UI with multiplier 0.001', function () {
      // 10^9 raw * 0.001 / 10^9 = 0.001
      rawToUiAmountString(1_000_000_000n, '0.001', 9).should.equal('0.001');
      // 1 raw * 0.001 / 10^9 = 10^-12
      rawToUiAmountString(1n, '0.001', 9).should.equal('0.000000000001');
    });

    it('converts raw to UI with multiplier 1e-9 (ticket extreme)', function () {
      // 10^9 raw * 10^-9 / 10^9 = 10^-9
      rawToUiAmountString(1_000_000_000n, '0.000000001', 9).should.equal('0.000000001');
      rawToUiAmountString(1n, '0.000000001', 9).should.equal('0.000000000000000001');
    });

    it('handles multipliers greater than 1', function () {
      // 2 raw * 1.5 / 10^2 = 0.03
      rawToUiAmountString(2n, '1.5', 2).should.equal('0.03');
      // 100 raw * 12.5 / 10^2 = 12.5
      rawToUiAmountString(100n, '12.5', 2).should.equal('12.5');
    });

    it('normalizes trailing zeros', function () {
      rawToUiAmountString(500_000_000n, '1', 9).should.equal('0.5');
      rawToUiAmountString(1_230_000_000n, '1', 9).should.equal('1.23');
    });

    it('rejects malformed inputs', function () {
      (() => rawToUiAmountString(-1n, '1', 9)).should.throw(/must be non-negative/);
      (() => rawToUiAmountString(1n, '0', 9)).should.throw(/must be positive/);
      (() => rawToUiAmountString(1n, '-0.001', 9)).should.throw(/must be positive/);
      (() => rawToUiAmountString(1n, '1e-9', 9)).should.throw(/finite decimal string/);
      (() => rawToUiAmountString(1n, 'abc', 9)).should.throw(/finite decimal string/);
      (() => rawToUiAmountString(1n, 'NaN', 9)).should.throw(/finite decimal string/);
      (() => rawToUiAmountString(1n, '1', -1)).should.throw(/non-negative integer/);
      (() => rawToUiAmountString(1n, '1', 1.5)).should.throw(/non-negative integer/);
      // @ts-expect-error runtime guard against non-BigInt raw
      (() => rawToUiAmountString(1000, '1', 9)).should.throw(/BigInt of base units/);
    });
  });

  describe('uiAmountToRaw', function () {
    it('converts UI to raw with multiplier 1', function () {
      uiAmountToRaw('1', '1', 9).should.equal(1_000_000_000n);
      uiAmountToRaw('0.000000001', '1', 9).should.equal(1n);
      uiAmountToRaw('0', '1', 9).should.equal(0n);
    });

    it('converts UI to raw with multiplier 0.001', function () {
      uiAmountToRaw('0.001', '0.001', 9).should.equal(1_000_000_000n);
      uiAmountToRaw('0.000000000001', '0.001', 9).should.equal(1n);
    });

    it('converts UI to raw with multiplier 1e-9 (ticket extreme)', function () {
      uiAmountToRaw('0.000000001', '0.000000001', 9).should.equal(1_000_000_000n);
      uiAmountToRaw('0.000000000000000001', '0.000000001', 9).should.equal(1n);
    });

    it('floors to integer base units', function () {
      // 1.0000000005 UI * 10^9 = 1000000000.5 raw -> floors to 1000000000
      uiAmountToRaw('1.0000000005', '1', 9).should.equal(1_000_000_000n);
    });

    it('rejects malformed inputs', function () {
      (() => uiAmountToRaw('-1', '1', 9)).should.throw(/must be non-negative/);
      (() => uiAmountToRaw('1', '0', 9)).should.throw(/must be positive/);
      (() => uiAmountToRaw('1e-9', '1', 9)).should.throw(/finite decimal string/);
      (() => uiAmountToRaw('1', '1', -1)).should.throw(/non-negative integer/);
    });
  });

  describe('round-trip exactness at multiplier extremes', function () {
    const multipliers = ['1', '0.001', '0.000000001', '1.5', '12.5'];
    const rawAmounts = [
      0n,
      1n,
      999n,
      1_000n,
      123_456_789n,
      1_000_000_000n,
      999_999_999_999_999_999n,
      10n ** 27n, // > u64 max supply, still exact
    ];

    for (const multiplier of multipliers) {
      it(`round-trips every raw amount through UI at multiplier ${multiplier}`, function () {
        for (const raw of rawAmounts) {
          const ui = rawToUiAmountString(raw, multiplier, 9);
          uiAmountToRaw(ui, multiplier, 9).should.equal(raw);
        }
      });
    }

    it('round-trips at decimals other than 9', function () {
      for (const decimals of [0, 2, 6, 18]) {
        for (const raw of rawAmounts) {
          const ui = rawToUiAmountString(raw, '0.001', decimals);
          uiAmountToRaw(ui, '0.001', decimals).should.equal(raw);
        }
      }
    });
  });
});
