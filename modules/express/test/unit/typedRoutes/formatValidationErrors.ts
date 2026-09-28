import * as assert from 'assert';
import * as t from 'io-ts';

import { formatValidationErrors } from '../../../src/typedRoutes/utils';

describe('formatValidationErrors', function () {
  it('should format missing required field', function () {
    const errors: t.Errors = [{ value: undefined, context: [{ key: 'name', type: t.string }] }];
    assert.strictEqual(formatValidationErrors(errors), "Missing required field 'name'.");
  });

  it('should format wrong type', function () {
    const errors: t.Errors = [{ value: 123, context: [{ key: 'field', type: t.string }] }];
    assert.strictEqual(formatValidationErrors(errors), "Invalid value for 'field': expected string, got '123'.");
  });

  it('should redact values on a sensitive path instead of interpolating them', function () {
    const errors: t.Errors = [{ value: { uShare: { seed: 'deadbeef' } }, context: [{ key: 'prv', type: t.string }] }];
    assert.strictEqual(formatValidationErrors(errors), "Invalid value for 'prv': expected string, got '[REDACTED]'.");
  });

  it('should redact a sensitive path regardless of value type', function () {
    const errors: t.Errors = [{ value: 'hunter2', context: [{ key: 'walletPassphrase', type: t.number }] }];
    assert.strictEqual(
      formatValidationErrors(errors),
      "Invalid value for 'walletPassphrase': expected number, got '[REDACTED]'."
    );
  });

  it('should interpolate structured values on a non-sensitive path', function () {
    const errors: t.Errors = [{ value: { invalid: 'object' }, context: [{ key: 'webauthnInfo', type: t.string }] }];
    assert.strictEqual(
      formatValidationErrors(errors),
      'Invalid value for \'webauthnInfo\': expected string, got \'{"invalid":"object"}\'.'
    );
  });

  it('should format nested paths', function () {
    const errors: t.Errors = [
      {
        value: 123,
        context: [
          { key: 'memo', type: t.object },
          { key: 'type', type: t.string },
        ],
      },
    ];
    assert.strictEqual(formatValidationErrors(errors), "Invalid value for 'memo.type': expected string, got '123'.");
  });

  it('should filter numeric indices', function () {
    const errors: t.Errors = [
      {
        value: 'x',
        context: [
          { key: 'recipients', type: t.array(t.unknown) },
          { key: '0', type: t.object },
          { key: 'amount', type: t.number },
        ],
      },
    ];
    assert.strictEqual(
      formatValidationErrors(errors),
      "Invalid value for 'recipients.amount': expected number, got 'x'."
    );
  });

  it('should filter body from path', function () {
    const errors: t.Errors = [
      {
        value: 123,
        context: [
          { key: 'body', type: t.object },
          { key: 'name', type: t.string },
        ],
      },
    ];
    assert.strictEqual(formatValidationErrors(errors), "Invalid value for 'name': expected string, got '123'.");
  });

  it('should skip undefined type errors', function () {
    const errors: t.Errors = [{ value: 123, context: [{ key: 'optional', type: t.undefined }] }];
    assert.strictEqual(formatValidationErrors(errors), '');
  });

  it('should return empty string for empty errors', function () {
    assert.strictEqual(formatValidationErrors([]), '');
  });

  it('should deduplicate same path', function () {
    const errors: t.Errors = [
      { value: {}, context: [{ key: 'value', type: t.string }] },
      { value: {}, context: [{ key: 'value', type: t.number }] },
    ];
    assert.strictEqual((formatValidationErrors(errors).match(/'value'/g) || []).length, 1);
  });
});
