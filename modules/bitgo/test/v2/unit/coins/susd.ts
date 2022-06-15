import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';

describe('SUSD:', function () {
  let bitgo;
  let susdCoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
    susdCoin = bitgo.coin('susd');
  });

  it('functions that return constants', function () {
    susdCoin.getChain().should.equal('susd');
    susdCoin.getFullName().should.equal('Silvergate USD');
    susdCoin.getFamily().should.equal('susd');
    susdCoin.getBaseFactor().should.equal(100);
  });

  it('isValidMofNSetup', function () {
    susdCoin.isValidMofNSetup({ m: 2, n: 3 }).should.be.false();
    susdCoin.isValidMofNSetup({ m: 1, n: 3 }).should.be.false();
    susdCoin.isValidMofNSetup({ m: 0, n: 0 }).should.be.true();
  });
});
