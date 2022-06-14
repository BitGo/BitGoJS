import 'should';

import { TestBitGo } from '../../../../modules/bitgo/test/lib/test_bitgo';

import { Talgo } from '../../src/index';

describe('Algorand', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('talgo');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('talgo');
    basecoin.should.be.an.instanceof(Talgo);
  });

  it('isValidAddress should be correct', function () {
    // TODO: Add valid addresses for testing
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
  });
});
