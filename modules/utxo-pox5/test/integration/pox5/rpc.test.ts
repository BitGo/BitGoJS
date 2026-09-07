import assert from 'node:assert/strict';

import { formatError } from './rpc';

describe('PoX-5 error formatting', function () {
  it('formats nested RPC errors with their code and message', function () {
    assert.equal(
      formatError({ result: null, error: { code: -6, message: 'Insufficient funds' } }),
      '-6: Insufficient funds'
    );
  });

  it('formats Error instances and structured detail fields', function () {
    assert.equal(formatError(new Error('wallet is not loaded')), 'wallet is not loaded');
    assert.equal(formatError({ detail: 'Bond is not open' }), 'Bond is not open');
  });
});
