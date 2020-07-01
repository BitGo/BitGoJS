import should from 'should';
import { getBuilder } from '../../src';

describe('Coin factory', () => {
  it('should fail to instantiate an unsupported coin', () => {
    should.throws(() => getBuilder('fakeUnsupported'));
  });

  it('should instantiate TRX builder properly', () => {
    const trxBuilder = getBuilder('trx');
    should.exist(trxBuilder);
  });

  it('should instantiate TTRX builder properly', () => {
    const ttrxBuilder = getBuilder('ttrx');
    should.exist(ttrxBuilder);
  });
});
