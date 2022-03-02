import 'should';

import { TestBitGo } from '../../../lib/test_bitgo';

describe('FIAT:', function () {
  let bitgo;
  let fiatCoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    fiatCoin = bitgo.coin('tfiat');
  });

  it('functions that return constants', function () {
    fiatCoin.getChain().should.equal('tfiat');
    fiatCoin.getFullName().should.equal('Test FIAT');
    fiatCoin.getFamily().should.equal('fiat');
    fiatCoin.getBaseFactor().should.equal(100);
  });

  it('isValidMofNSetup', function () {
    fiatCoin.isValidMofNSetup({ m: 2, n: 3 }).should.be.false();
    fiatCoin.isValidMofNSetup({ m: 1, n: 3 }).should.be.false();
    fiatCoin.isValidMofNSetup({ m: 0, n: 0 }).should.be.true();
  });
});

describe('FIAT:USD', function () {
  let bitgo;
  let fiatUSD;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    fiatUSD = bitgo.coin('tfiat:USD');
  });

  it('functions that return constants', function () {
    fiatUSD.getChain().should.equal('tfiat:USD');
    fiatUSD.name.should.equal('FIAT US Dollar');
    fiatUSD.getFullName().should.equal('FIAT Token');
    fiatUSD.decimalPlaces.should.equal(2);
    fiatUSD.getFamily().should.equal('fiat');
    fiatUSD.getBaseFactor().should.equal(100);
  });
});
