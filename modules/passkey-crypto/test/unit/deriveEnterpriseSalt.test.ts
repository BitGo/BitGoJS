import * as assert from 'assert';
import { deriveEnterpriseSalt } from '../../src';

// Real fixture values captured from a live environment (DB + browser devtools)
const REAL_FIXTURE = {
  basePrfSalt: 'ZqJ64M2dL65zn2-Jxd58SMN2ILc9QjbCFxUTGHd_LC8',
  enterpriseId: '69c2aea1a3d7bc07f7f775c0ca86b0ec',
  expectedDerivedSalt: 'oiasOqzkuyuEz/8043+3IXYghSu3LV4N/a1MLIRzmU8=',
};

describe('deriveEnterpriseSalt', function () {
  it('produces the correct derived salt for real fixture values', function () {
    // Verifies SDK output matches what the retail UI produces for the same inputs,
    // ensuring clients can move between SDK and retail app seamlessly.
    assert.strictEqual(
      deriveEnterpriseSalt(REAL_FIXTURE.basePrfSalt, REAL_FIXTURE.enterpriseId),
      REAL_FIXTURE.expectedDerivedSalt
    );
  });

  it('is deterministic — same inputs always produce the same salt', function () {
    const first = deriveEnterpriseSalt(REAL_FIXTURE.basePrfSalt, REAL_FIXTURE.enterpriseId);
    const second = deriveEnterpriseSalt(REAL_FIXTURE.basePrfSalt, REAL_FIXTURE.enterpriseId);
    assert.ok(first);
    assert.strictEqual(first, second);
  });

  it('produces different salts for different enterpriseIds with the same prfSalt', function () {
    const saltA = deriveEnterpriseSalt(REAL_FIXTURE.basePrfSalt, REAL_FIXTURE.enterpriseId);
    const saltB = deriveEnterpriseSalt(REAL_FIXTURE.basePrfSalt, 'different-enterprise-id');
    assert.notStrictEqual(saltA, saltB);
  });

  it('produces different salts for different prfSalts with the same enterpriseId', function () {
    const saltA = deriveEnterpriseSalt(REAL_FIXTURE.basePrfSalt, REAL_FIXTURE.enterpriseId);
    const saltB = deriveEnterpriseSalt('deadbeefcafebabe0102030405060708', REAL_FIXTURE.enterpriseId);
    assert.notStrictEqual(saltA, saltB);
  });

  it('returns a non-empty base64 string', function () {
    const result = deriveEnterpriseSalt(REAL_FIXTURE.basePrfSalt, REAL_FIXTURE.enterpriseId);
    assert.strictEqual(typeof result, 'string');
    assert.ok(result.length > 0);
    assert.match(result, /^[A-Za-z0-9+/]+=*$/);
  });
});
