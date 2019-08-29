import * as Promise from 'bluebird';
import * as should from 'should';

const co = Promise.coroutine;
const TestV2BitGo = require('../../../lib/test_bitgo');

describe('TRON:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'mock' });
    bitgo.initializeTestVars();
  });

  it('should hoist the coin', function() {
    const basecoin = bitgo.coin('talgo');
    should.exist(basecoin);
  });
});
