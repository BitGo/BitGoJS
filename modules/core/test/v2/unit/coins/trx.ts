import * as Promise from 'bluebird';
import * as should from 'should';

const co = Promise.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';

describe('TRON:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
  });

  it('should hoist the coin', function() {
    const basecoin = bitgo.coin('ttrx');
    should.exist(basecoin);
  });
});
