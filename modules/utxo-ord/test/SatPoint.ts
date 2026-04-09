import * as assert from 'assert';
import { formatSatPoint, isSatPoint, parseSatPoint } from '../src';

describe('SatPoint', function () {
  describe('parseSatPoint', function () {
    const txid = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00';
    const satPoint = `${txid}:0:0` as const;
    it('parses SatPoints', function () {
      assert.deepStrictEqual(parseSatPoint(satPoint), {
        txid: txid,
        vout: 0,
        offset: BigInt(0),
      });
      assert.ok(isSatPoint(satPoint));
      assert.strictEqual(isSatPoint(satPoint.slice(1)), false);
      assert.deepStrictEqual(formatSatPoint(parseSatPoint(satPoint)), satPoint);
    });
  });
});
