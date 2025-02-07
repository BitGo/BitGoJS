import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getBuilder } from '../../src/lib/builder';

describe('Coin factory', () => {
  it('should instantiate TRX builder properly', () => {
    const trxBuilder = getBuilder('trx');
    assert.ok(trxBuilder);
  });

  it('should instantiate TTRX builder properly', () => {
    const ttrxBuilder = getBuilder('ttrx');
    assert.ok(ttrxBuilder);
  });
});
