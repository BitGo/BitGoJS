import 'should';
import { TestBitGo } from '../../../lib/test_bitgo';

describe('FIAT:USD', function () {
  let bitgo;
  let fiatUSD;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    fiatUSD = bitgo.coin('fiat:USD');
  });

  it('functions that return constants', function () {
    fiatUSD.getChain().should.equal('fiat:USD');
    fiatUSD.name.should.equal('FIAT US Dollar');
    fiatUSD.getFullName().should.equal('FIAT Token');
    fiatUSD.decimalPlaces.should.equal(2);
    fiatUSD.getFamily().should.equal('fiat');
    fiatUSD.getBaseFactor().should.equal(100);
  });
});
