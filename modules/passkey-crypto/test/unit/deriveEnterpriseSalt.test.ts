import * as assert from 'assert';
import { createHmac } from 'crypto';
import { deriveEnterpriseSalt } from '../../src';

describe('deriveEnterpriseSalt', function () {
  const BASE_SALT = 'server-provided-base-salt';
  const ENTERPRISE_ID = 'ent-abc123';

  it('returns a hex string', function () {
    const result = deriveEnterpriseSalt(BASE_SALT, ENTERPRISE_ID);
    assert.match(result, /^[0-9a-f]+$/);
  });

  it('returns a 64-character string (SHA-256 = 32 bytes = 64 hex chars)', function () {
    const result = deriveEnterpriseSalt(BASE_SALT, ENTERPRISE_ID);
    assert.strictEqual(result.length, 64);
  });

  it('matches a known HMAC-SHA256 test vector', function () {
    const expected = createHmac('sha256', BASE_SALT).update(ENTERPRISE_ID).digest('hex');
    assert.strictEqual(deriveEnterpriseSalt(BASE_SALT, ENTERPRISE_ID), expected);
  });

  it('is deterministic — same inputs produce same output', function () {
    assert.strictEqual(deriveEnterpriseSalt(BASE_SALT, ENTERPRISE_ID), deriveEnterpriseSalt(BASE_SALT, ENTERPRISE_ID));
  });

  it('produces different output for different enterprise IDs', function () {
    const a = deriveEnterpriseSalt(BASE_SALT, 'ent-aaa');
    const b = deriveEnterpriseSalt(BASE_SALT, 'ent-bbb');
    assert.notStrictEqual(a, b);
  });

  it('produces different output for different base salts', function () {
    const a = deriveEnterpriseSalt('salt-one', ENTERPRISE_ID);
    const b = deriveEnterpriseSalt('salt-two', ENTERPRISE_ID);
    assert.notStrictEqual(a, b);
  });
});
