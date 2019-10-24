import { TransactionBuilder } from '../../src/';
import * as should from 'should';

describe('Coin factory', () => {
  it('should fail to instantiate an unsupported coin', () => {
    should.throws(() => new TransactionBuilder({ coinName : 'fakeUnsupported' }));
  });

  it('should instantiate TRX builder properly', () => {
    const trxBuilder = new TransactionBuilder({ coinName : 'trx' });
    should.exist(trxBuilder);
  });

  it('should instantiate TTRX builder properly', () => {
    const ttrxBuilder = new TransactionBuilder({ coinName : 'ttrx' });
    should.exist(ttrxBuilder);
  });
});
