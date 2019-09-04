import * as Promise from 'bluebird';
import * as should from 'should';
import { Trx } from '../../../../src/v2/coins/trx';

const co = Promise.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';

describe('TRON:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
  });

  it('should instantiate the coin', function() {
    const basecoin = bitgo.coin('trx');
    basecoin.should.be.an.instanceof(Trx);
  });
});
