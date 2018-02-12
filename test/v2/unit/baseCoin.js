//
// Tests for Wallets
//

require('should');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('V2 Base Coin:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    // TODO: replace dev with test
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('teth');
    basecoin.keychains();
  });

  describe('Currenncy conversion', function() {
    it('should convert wei amounts to ETH', function() {
      // 1 wei
      basecoin.baseUnitsToBigUnits(1).should.equal('0.000000000000000001');
      // 100 wei
      basecoin.baseUnitsToBigUnits(100).should.equal('0.0000000000000001');
      // 1 ETH
      basecoin.baseUnitsToBigUnits('1000000000000000000').should.equal('1');
      // others
      basecoin.baseUnitsToBigUnits('1000000010000000000').should.equal('1.00000001');
    });
  });

  describe('supportsBlockTarget', function() {
    it('should return false', function() {
      basecoin.supportsBlockTarget().should.equal(false);
    });
  });
});
