import should from 'should';
import { getBuilder } from '../../src/lib/builder';
import { describe, it } from 'node:test';

describe('Coin factory', () => {
  it('should instantiate TRX builder properly', () => {
    const trxBuilder = getBuilder('trx');
    should.exist(trxBuilder);
  });

  it('should instantiate TTRX builder properly', () => {
    const ttrxBuilder = getBuilder('ttrx');
    should.exist(ttrxBuilder);
  });
});
