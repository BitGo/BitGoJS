import 'should';
import { TestBitGo } from '../../../lib/test_bitgo';

describe('FIAT', function () {
  let bitgo;
  let fiat;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    fiat = bitgo.coin('tfiat');
  });

  it('functions that return constants', function () {
    fiat.getChain().should.equal('tfiat');
    fiat.type.should.equal('tfiat');
    fiat.getFullName().should.equal('Test Fiat');
    fiat.getFamily().should.equal('fiat');
    fiat.getBaseFactor().should.equal(100);
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
